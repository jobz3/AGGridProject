const express = require('express');
const pool = require('../utils/db'); // mysql2/promise pool
const router = express.Router();

const table = (process.env.TABLE_NAME || 'data_table').replace(/`/g, '');
const MAX_COLUMNS_PER_TABLE = 50; // Threshold to switch to JSON storage

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    
    // If using JSON storage, parse the data
    const parsedRows = rows.map(row => {
      if (row.json_data) {
        const jsonData = JSON.parse(row.json_data);
        delete row.json_data;
        return { ...row, ...jsonData };
      }
      return row;
    });

    return res.json({ rows: parsedRows });
  } catch (err) {
    console.error('GET /api/data error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/save', async (req, res) => {
  try {
    const sample_data = req.body['data'];
    // console.log(sample_data);
    const [result] = await pool.query(`INSERT INTO ${table} (name) VALUES (?)`, [sample_data]);
    console.log(result);
    return res.json({ result });
  } catch (err) {
    console.error('POST /api/save error', err);
    return res.status(500).json({ error: err.message || 'Server Error'});
  }
});

router.post('/push-data', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { rows } = req.body;
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No data provided or invalid format' });
    }

    // Start transaction
    await connection.beginTransaction();

    // Drop the table if it exists
    await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    console.log(`Table ${table} dropped`);

    // Get column names from the first row
    const allColumns = Object.keys(rows[0]);
    const columnCount = allColumns.length;
    
    console.log(`Processing ${rows.length} rows with ${columnCount} columns`);

    // Validate that all rows have the same columns
    const allRowsValid = rows.every(row => {
      const rowKeys = Object.keys(row);
      return rowKeys.length === allColumns.length && 
             rowKeys.every(key => allColumns.includes(key));
    });

    if (!allRowsValid) {
      throw new Error('Inconsistent column structure in data');
    }

    // STRATEGY 1: If many columns, use JSON storage
    if (columnCount > MAX_COLUMNS_PER_TABLE) {
      console.log(`Column count (${columnCount}) exceeds threshold. Using JSON storage strategy.`);
      
      // Create a simple table with JSON column
      const createTableQuery = `
        CREATE TABLE \`${table}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          json_data LONGTEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      
      await connection.query(createTableQuery);
      console.log(`Table ${table} created with JSON storage`);

      // Insert data as JSON in batches to avoid memory issues
      const BATCH_SIZE = 1000;
      let insertedCount = 0;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() => '(?)').join(', ');
        const insertQuery = `INSERT INTO \`${table}\` (json_data) VALUES ${placeholders}`;
        const values = batch.map(row => JSON.stringify(row));
        
        await connection.query(insertQuery, values);
        insertedCount += batch.length;
        console.log(`Inserted batch: ${insertedCount}/${rows.length}`);
      }

      await connection.commit();
      console.log(`Successfully inserted ${rows.length} rows using JSON storage`);
      
      return res.json({ 
        success: true, 
        message: `Successfully imported ${rows.length} rows using JSON storage`,
        rowsInserted: rows.length,
        columns: allColumns,
        storageType: 'json'
      });
    }

    // STRATEGY 2: Normal column-based storage for reasonable column counts
    console.log(`Using traditional column-based storage for ${columnCount} columns`);

    // Determine column types based on data
    const columnDefinitions = allColumns.map(col => {
      const sampleValues = rows.slice(0, Math.min(100, rows.length)).map(row => row[col]);
      
      // Check max length for strings
      const maxLength = Math.max(
        ...sampleValues
          .filter(val => val !== null && val !== undefined)
          .map(val => String(val).length)
      );

      // Determine appropriate type
      let dataType;
      
      // Use VARCHAR for short strings, TEXT for longer ones
      if (maxLength === 0) {
        dataType = 'VARCHAR(255)'; // Default for empty columns
      } else if (maxLength <= 100) {
        dataType = 'VARCHAR(255)';
      } else if (maxLength <= 1000) {
        dataType = 'VARCHAR(1000)';
      } else if (maxLength <= 5000) {
        dataType = 'TEXT'; // 65KB max
      } else if (maxLength <= 20000) {
        dataType = 'MEDIUMTEXT'; // 16MB max
      } else {
        dataType = 'LONGTEXT'; // 4GB max
      }

      return `\`${col}\` ${dataType}`;
    });

    // Create table with dynamic columns
    // Use ROW_FORMAT=DYNAMIC to support larger rows
    const createTableQuery = `
      CREATE TABLE \`${table}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ${columnDefinitions.join(',\n        ')},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB 
        ROW_FORMAT=DYNAMIC 
        DEFAULT CHARSET=utf8mb4 
        COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.query(createTableQuery);
    console.log(`Table ${table} created with ${columnCount} columns`);

    // Insert data in batches to avoid query size limits
    const BATCH_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => `(${allColumns.map(() => '?').join(', ')})`).join(', ');
      const insertQuery = `INSERT INTO \`${table}\` (${allColumns.map(col => `\`${col}\``).join(', ')}) VALUES ${placeholders}`;
      const values = batch.flatMap(row => allColumns.map(col => row[col]));
      
      await connection.query(insertQuery, values);
      insertedCount += batch.length;
      console.log(`Inserted batch: ${insertedCount}/${rows.length}`);
    }

    await connection.commit();
    console.log(`Successfully inserted ${rows.length} rows`);
    
    return res.json({ 
      success: true, 
      message: `Successfully imported ${rows.length} rows`,
      rowsInserted: rows.length,
      columns: allColumns,
      storageType: 'columns'
    });

  } catch (err) {
    await connection.rollback();
    console.error('POST /api/push-data error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    connection.release();
  }
});

// Search endpoint - handles both storage types
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Check if table uses JSON storage
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
    `, [table]);

    const columnNames = columns.map(col => col.COLUMN_NAME);
    const hasJsonData = columnNames.includes('json_data');

    if (hasJsonData) {
      // JSON storage: search within JSON
      const [rows] = await pool.query(
        `SELECT * FROM \`${table}\` WHERE json_data LIKE ?`,
        [`%${query}%`]
      );

      // Parse JSON data
      const parsedRows = rows.map(row => {
        const jsonData = JSON.parse(row.json_data);
        delete row.json_data;
        return { ...row, ...jsonData };
      });

      return res.json({ rows: parsedRows, count: parsedRows.length });
    } else {
      // Traditional column search
      const searchColumns = columnNames.filter(col => 
        !['id', 'created_at'].includes(col)
      );

      const whereConditions = searchColumns.map(col => `\`${col}\` LIKE ?`).join(' OR ');
      const searchValue = `%${query}%`;
      const searchParams = searchColumns.map(() => searchValue);

      const [rows] = await pool.query(
        `SELECT * FROM \`${table}\` WHERE ${whereConditions}`,
        searchParams
      );

      return res.json({ rows, count: rows.length });
    }
  } catch (err) {
    console.error('GET /api/search error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Filter endpoint - handles both storage types
router.post('/filter', async (req, res) => {
  try {
    const { filters } = req.body;
    
    // Check storage type
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
    `, [table]);

    const columnNames = columns.map(col => col.COLUMN_NAME);
    const hasJsonData = columnNames.includes('json_data');

    if (hasJsonData) {
      // For JSON storage, we need to fetch all and filter in memory
      const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
      
      let parsedRows = rows.map(row => {
        const jsonData = JSON.parse(row.json_data);
        return { id: row.id, created_at: row.created_at, ...jsonData };
      });

      // Apply filters in memory
      if (filters && Array.isArray(filters) && filters.length > 0) {
        parsedRows = parsedRows.filter(row => {
          return filters.every(filter => {
            const { column, operator, value } = filter;
            const cellValue = row[column];

            switch (operator) {
              case 'contains':
                return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
              case 'equals':
                return cellValue == value;
              case 'starts_with':
                return String(cellValue).toLowerCase().startsWith(String(value).toLowerCase());
              case 'ends_with':
                return String(cellValue).toLowerCase().endsWith(String(value).toLowerCase());
              case 'is_empty':
                return cellValue === null || cellValue === undefined || cellValue === '';
              case 'is_not_empty':
                return cellValue !== null && cellValue !== undefined && cellValue !== '';
              case 'greater_than':
                return Number(cellValue) > Number(value);
              case 'less_than':
                return Number(cellValue) < Number(value);
              case 'greater_than_or_equal':
                return Number(cellValue) >= Number(value);
              case 'less_than_or_equal':
                return Number(cellValue) <= Number(value);
              default:
                return true;
            }
          });
        });
      }

      return res.json({ rows: parsedRows, count: parsedRows.length });
    } else {
      // Traditional column-based filtering
      if (!filters || !Array.isArray(filters) || filters.length === 0) {
        const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
        return res.json({ rows, count: rows.length });
      }

      const whereConditions = [];
      const params = [];

      filters.forEach(filter => {
        const { column, operator, value } = filter;
        
        switch (operator) {
          case 'contains':
            whereConditions.push(`\`${column}\` LIKE ?`);
            params.push(`%${value}%`);
            break;
          case 'equals':
            whereConditions.push(`\`${column}\` = ?`);
            params.push(value);
            break;
          case 'starts_with':
            whereConditions.push(`\`${column}\` LIKE ?`);
            params.push(`${value}%`);
            break;
          case 'ends_with':
            whereConditions.push(`\`${column}\` LIKE ?`);
            params.push(`%${value}`);
            break;
          case 'is_empty':
            whereConditions.push(`(\`${column}\` IS NULL OR \`${column}\` = '')`);
            break;
          case 'is_not_empty':
            whereConditions.push(`(\`${column}\` IS NOT NULL AND \`${column}\` != '')`);
            break;
          case 'greater_than':
            whereConditions.push(`CAST(\`${column}\` AS DECIMAL) > ?`);
            params.push(value);
            break;
          case 'less_than':
            whereConditions.push(`CAST(\`${column}\` AS DECIMAL) < ?`);
            params.push(value);
            break;
          case 'greater_than_or_equal':
            whereConditions.push(`CAST(\`${column}\` AS DECIMAL) >= ?`);
            params.push(value);
            break;
          case 'less_than_or_equal':
            whereConditions.push(`CAST(\`${column}\` AS DECIMAL) <= ?`);
            params.push(value);
            break;
          default:
            break;
        }
      });

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const [rows] = await pool.query(
        `SELECT * FROM \`${table}\` ${whereClause}`,
        params
      );

      return res.json({ rows, count: rows.length });
    }
  } catch (err) {
    console.error('POST /api/filter error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/delete-row', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { ids } = req.body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No row IDs provided' });
    }

    // Validate that all IDs are numbers
    const validIds = ids.every(id => Number.isInteger(id) && id > 0);
    if (!validIds) {
      return res.status(400).json({ error: 'Invalid row IDs provided' });
    }

    await connection.beginTransaction();

    // Create placeholders for the IN clause
    const placeholders = ids.map(() => '?').join(', ');
    
    // Delete rows by IDs
    const [result] = await connection.query(
      `DELETE FROM \`${table}\` WHERE id IN (${placeholders})`,
      ids
    );

    await connection.commit();

    console.log(`Successfully deleted ${result.affectedRows} row(s)`);
    
    return res.json({ 
      success: true, 
      message: `Successfully deleted ${result.affectedRows} row(s)`,
      deletedCount: result.affectedRows
    });

  } catch (err) {
    await connection.rollback();
    console.error('DELETE /api/delete-row error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    connection.release();
  }
});

module.exports = router;