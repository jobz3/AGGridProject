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

export async function searchData(query) {
    try {
        const res = await api.get('/search', {
            params: { query }
        });
        console.log('Search results:', res.data);
        return res.data;
    } catch (err) {
        console.error('Error searching data:', err);
        throw err;
    }
}

export async function filterData(filters) {
    try {
        const res = await api.post('/filter', {
            filters
        });
        console.log('Filter results:', res.data);
        return res.data;
    } catch (err) {
        console.error('Error filtering data:', err);
        throw err;
    }
}

export async function deleteRows(ids) {
    try {
        const res = await api.delete('/delete-row', {
            data: { ids }
        });
        console.log('Delete successful:', res.data);
        return res.data;
    } catch (err) {
        console.error('Error deleting rows:', err);
        throw err;
    }
}