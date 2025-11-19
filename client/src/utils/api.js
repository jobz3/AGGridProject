import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api'
});

export async function getData(page = 1, pageSize = 100) {
    try {
        const res = await api.get('/', {
            params: { page, pageSize }
        });
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

export async function pushDataChunked(csvData, chunkSize = 1000, onProgress) {
    try {
        const totalRows = csvData.length;
        const columnCount = csvData.length > 0 ? Object.keys(csvData[0]).length : 0;

        let adaptiveChunkSize = chunkSize;
        if (columnCount > 1000) {
            adaptiveChunkSize = Math.max(10, Math.floor(50000 / columnCount));
        } else if (columnCount > 500) {
            adaptiveChunkSize = Math.max(50, Math.floor(100000 / columnCount));
        } else if (columnCount > 100) {
            adaptiveChunkSize = Math.max(100, Math.floor(200000 / columnCount));
        }

        const chunks = Math.ceil(totalRows / adaptiveChunkSize);

        for (let i = 0; i < chunks; i++) {
            const start = i * adaptiveChunkSize;
            const end = Math.min(start + adaptiveChunkSize, totalRows);
            const chunkData = csvData.slice(start, end);

            const res = await api.post('/push-data-chunked', {
                rows: chunkData,
                chunkIndex: i,
                totalChunks: chunks,
                isFirstChunk: i === 0,
                isLastChunk: i === chunks - 1
            });

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: chunks,
                    percentage: Math.round(((i + 1) / chunks) * 100),
                    rowsProcessed: end,
                    totalRows: totalRows,
                    chunkSize: adaptiveChunkSize
                });
            }
        }

        return {
            success: true,
            message: `Successfully imported ${totalRows} rows in ${chunks} chunks`,
            rowsInserted: totalRows,
            chunks: chunks
        };
    } catch (err) {
        console.error('Error pushing chunked data:', err);
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