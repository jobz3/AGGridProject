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
    const [result, fields] = await pool.query(`INSERT INTO ${table} (name) VALUES ('${sample_data}')`);
    console.log(res);
    return res.json({ res });
  } catch (err) {
    console.error('POST /api/save error', err);
    return res.status(500).json({ error: err.message || 'Server Error'});
  }
});

module.exports = router;
