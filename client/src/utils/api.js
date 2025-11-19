import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api'
});

export async function getData() {
    try {
        const res = await api.get('/');
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
        return res.data;
    } catch (err) {
        console.error('Error deleting rows:', err);
        throw err;
    }
}