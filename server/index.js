const express = require('express')
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config({path: "../.env", quiet: true});
const PORT = process.env.PORT || 3000;
const dataRouter = require('./routes/data');

app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello');
})

app.use('/api/', dataRouter);

app.listen(PORT, '0.0.0.0', () => console.log(`Server Running at PORT ${PORT}`));
