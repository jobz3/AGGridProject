import axios from 'axios';
const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000/api'
});
export async function getData() {
    try {
        const res = await api.get('/');
        console.log(res.data);
        return res.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function pushData(csvData) {
    try {
        const res = await api.post('/push-data', {
            rows: csvData
        });
        console.log('Data pushed successfully:', res.data);
        return res.data;
    } catch (err) {
        console.error('Error pushing data:', err);
        throw err;
    }
}