const express = require('express');
const pool = require('../utils/db'); // mysql2/promise pool
const router = express.Router();

const table = (process.env.TABLE_NAME || 'data_table').replace(/`/g, '');

router.get('/', async (req, res) => {
  try {
    const [rows, fields] = await pool.query(`SELECT * FROM \`${table}\``);

    return res.json({ rows });
  } catch (err) {
    console.error('GET /api/data error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/save', async (req, res) => {
  try {
    const sample_data = req.body['data'];
    console.log(sample_data);
    const [result, fields] = await pool.query(`INSERT INTO ${table} (name) VALUES (?)`, [sample_data]);
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
    const columns = Object.keys(rows[0]);
    
    // Validate that all rows have the same columns
    const allRowsValid = rows.every(row => {
      const rowKeys = Object.keys(row);
      return rowKeys.length === columns.length && 
             rowKeys.every(key => columns.includes(key));
    });

    if (!allRowsValid) {
      throw new Error('Inconsistent column structure in data');
    }

    // Determine column types based on data
    const columnDefinitions = columns.map(col => {
      // Sample first few values to determine type
      const sampleValues = rows.slice(0, 10).map(row => row[col]);
      
      // Check if all values are numbers
      const allNumbers = sampleValues.every(val => 
        val === null || val === undefined || val === '' || !isNaN(val)
      );
      
      // Check if all numbers are integers
      const allIntegers = allNumbers && sampleValues.every(val => 
        val === null || val === undefined || val === '' || Number.isInteger(Number(val))
      );
      
      // Check if values are booleans
      const allBooleans = sampleValues.every(val => 
        val === null || val === undefined || val === '' || 
        typeof val === 'boolean' || val === 0 || val === 1 || 
        val === true || val === false
      );

      // Determine data type
      let dataType;
      if (allBooleans) {
        dataType = 'BOOLEAN';
      } else if (allIntegers) {
        dataType = 'VARCHAR(255)';
      } else if (allNumbers) {
        dataType = 'DECIMAL(10,2)';
      } else {
        dataType = 'VARCHAR(255)';
      }

      return `\`${col}\` ${dataType}`;
    });

    // Create table with dynamic columns
    const createTableQuery = `
      CREATE TABLE \`${table}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ${columnDefinitions.join(',\n        ')},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await connection.query(createTableQuery);
    console.log(`Table ${table} created with columns:`, columns);

    // Prepare bulk insert
    const placeholders = rows.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const insertQuery = `INSERT INTO \`${table}\` (${columns.map(col => `\`${col}\``).join(', ')}) VALUES ${placeholders}`;
    
    // Flatten all values into a single array
    const values = rows.flatMap(row => columns.map(col => row[col]));
    
    // Execute bulk insert
    await connection.query(insertQuery, values);

    // Commit transaction
    await connection.commit();

    console.log(`Successfully inserted ${rows.length} rows into ${table}`);
    return res.json({ 
      success: true, 
      message: `Successfully imported ${rows.length} rows`,
      rowsInserted: rows.length,
      columns: columns 
    });

  } catch (err) {
    // Rollback on error
    await connection.rollback();
    console.error('POST /api/push-data error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    // Release connection back to pool
    connection.release();
  }
});

module.exports = router;