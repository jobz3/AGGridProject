const express = require('express');
const pool = require('../utils/db');
const router = express.Router();

const table = (process.env.TABLE_NAME || 'data_table').replace(/`/g, '');
const MAX_COLUMNS_PER_TABLE = 50;

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);

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
    const [result] = await pool.query(`INSERT INTO ${table} (name) VALUES (?)`, [sample_data]);
    return res.json({ result });
  } catch (err) {
    console.error('POST /api/save error', err);
    return res.status(500).json({ error: err.message || 'Server Error'});
  }
});

router.post('/push-data-chunked', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { rows, chunkIndex, totalChunks, isFirstChunk, isLastChunk } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No data provided or invalid format' });
    }

    if (isFirstChunk) {
      await connection.beginTransaction();
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);

      const allColumns = Object.keys(rows[0]);
      const columnCount = allColumns.length;

      if (columnCount > MAX_COLUMNS_PER_TABLE) {
        const createTableQuery = `
          CREATE TABLE \`${table}\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            json_data LONGTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_created (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        await connection.query(createTableQuery);
      } else {
        const columnDefinitions = allColumns.map(col => {
          const sampleValues = rows.slice(0, Math.min(100, rows.length)).map(row => row[col]);
          const maxLength = Math.max(
            ...sampleValues
              .filter(val => val !== null && val !== undefined)
              .map(val => String(val).length)
          );

          let dataType;
          if (maxLength === 0) {
            dataType = 'VARCHAR(255)';
          } else if (maxLength <= 100) {
            dataType = 'VARCHAR(255)';
          } else if (maxLength <= 1000) {
            dataType = 'VARCHAR(1000)';
          } else if (maxLength <= 5000) {
            dataType = 'TEXT';
          } else if (maxLength <= 20000) {
            dataType = 'MEDIUMTEXT';
          } else {
            dataType = 'LONGTEXT';
          }

          return `\`${col}\` ${dataType}`;
        });

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
      }

      await connection.commit();
    }

    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `, [table]);

    const columnNames = columns.map(col => col.COLUMN_NAME);
    const hasJsonData = columnNames.includes('json_data');
    const allColumns = Object.keys(rows[0]);

    await connection.beginTransaction();

    if (hasJsonData) {
      const BATCH_SIZE = 1000;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() => '(?)').join(', ');
        const insertQuery = `INSERT INTO \`${table}\` (json_data) VALUES ${placeholders}`;
        const values = batch.map(row => JSON.stringify(row));
        await connection.query(insertQuery, values);
      }
    } else {
      const BATCH_SIZE = 100;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() => `(${allColumns.map(() => '?').join(', ')})`).join(', ');
        const insertQuery = `INSERT INTO \`${table}\` (${allColumns.map(col => `\`${col}\``).join(', ')}) VALUES ${placeholders}`;
        const values = batch.flatMap(row => allColumns.map(col => row[col]));
        await connection.query(insertQuery, values);
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} processed`,
      chunkIndex,
      totalChunks,
      rowsInChunk: rows.length
    });

  } catch (err) {
    await connection.rollback();
    console.error('POST /api/push-data-chunked error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    connection.release();
  }
});

router.post('/push-data', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No data provided or invalid format' });
    }

    await connection.beginTransaction();

    await connection.query(`DROP TABLE IF EXISTS \`${table}\``);

    const allColumns = Object.keys(rows[0]);
    const columnCount = allColumns.length;

    const allRowsValid = rows.every(row => {
      const rowKeys = Object.keys(row);
      return rowKeys.length === allColumns.length &&
             rowKeys.every(key => allColumns.includes(key));
    });

    if (!allRowsValid) {
      throw new Error('Inconsistent column structure in data');
    }

    if (columnCount > MAX_COLUMNS_PER_TABLE) {
      const createTableQuery = `
        CREATE TABLE \`${table}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          json_data LONGTEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      await connection.query(createTableQuery);

      const BATCH_SIZE = 1000;
      let insertedCount = 0;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() => '(?)').join(', ');
        const insertQuery = `INSERT INTO \`${table}\` (json_data) VALUES ${placeholders}`;
        const values = batch.map(row => JSON.stringify(row));

        await connection.query(insertQuery, values);
        insertedCount += batch.length;
      }

      await connection.commit();

      return res.json({
        success: true,
        message: `Successfully imported ${rows.length} rows using JSON storage`,
        rowsInserted: rows.length,
        columns: allColumns,
        storageType: 'json'
      });
    }

    const columnDefinitions = allColumns.map(col => {
      const sampleValues = rows.slice(0, Math.min(100, rows.length)).map(row => row[col]);

      const maxLength = Math.max(
        ...sampleValues
          .filter(val => val !== null && val !== undefined)
          .map(val => String(val).length)
      );

      let dataType;

      if (maxLength === 0) {
        dataType = 'VARCHAR(255)';
      } else if (maxLength <= 100) {
        dataType = 'VARCHAR(255)';
      } else if (maxLength <= 1000) {
        dataType = 'VARCHAR(1000)';
      } else if (maxLength <= 5000) {
        dataType = 'TEXT';
      } else if (maxLength <= 20000) {
        dataType = 'MEDIUMTEXT';
      } else {
        dataType = 'LONGTEXT';
      }

      return `\`${col}\` ${dataType}`;
    });

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

    const BATCH_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => `(${allColumns.map(() => '?').join(', ')})`).join(', ');
      const insertQuery = `INSERT INTO \`${table}\` (${allColumns.map(col => `\`${col}\``).join(', ')}) VALUES ${placeholders}`;
      const values = batch.flatMap(row => allColumns.map(col => row[col]));

      await connection.query(insertQuery, values);
      insertedCount += batch.length;
    }

    await connection.commit();

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

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const [columns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `, [table]);

    const columnNames = columns.map(col => col.COLUMN_NAME);
    const hasJsonData = columnNames.includes('json_data');

    if (hasJsonData) {
      const [rows] = await pool.query(
        `SELECT * FROM \`${table}\` WHERE json_data LIKE ?`,
        [`%${query}%`]
      );

      const parsedRows = rows.map(row => {
        const jsonData = JSON.parse(row.json_data);
        delete row.json_data;
        return { ...row, ...jsonData };
      });

      return res.json({ rows: parsedRows, count: parsedRows.length });
    } else {
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

router.post('/filter', async (req, res) => {
  try {
    const { filters } = req.body;

    const [columns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `, [table]);

    const columnNames = columns.map(col => col.COLUMN_NAME);
    const hasJsonData = columnNames.includes('json_data');

    if (hasJsonData) {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\``);

      let parsedRows = rows.map(row => {
        const jsonData = JSON.parse(row.json_data);
        return { id: row.id, created_at: row.created_at, ...jsonData };
      });

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

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No row IDs provided' });
    }

    const validIds = ids.every(id => Number.isInteger(id) && id > 0);
    if (!validIds) {
      return res.status(400).json({ error: 'Invalid row IDs provided' });
    }

    await connection.beginTransaction();

    const placeholders = ids.map(() => '?').join(', ');

    const [result] = await connection.query(
      `DELETE FROM \`${table}\` WHERE id IN (${placeholders})`,
      ids
    );

    await connection.commit();

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
