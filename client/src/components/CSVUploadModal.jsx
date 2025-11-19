import { useState, useCallback, useMemo } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { AgGridReact } from 'ag-grid-react';
import Papa from 'papaparse';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { pushData, pushDataChunked } from '../utils/api';
import { useThemeMode } from '../context/ThemeContext.jsx';
import { themeQuartz, colorSchemeDark, colorSchemeLight, iconSetMaterial } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';

export default function CSVUploadModal({ open, onClose, onDataImport }) {
    const { mode } = useThemeMode();
    const [csvData, setCsvData] = useState(null);
    const [columnDefs, setColumnDefs] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStats, setUploadStats] = useState(null);

    const isDarkMode = mode === 'dark';

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 1200,
        maxHeight: '90vh',
        bgcolor: isDarkMode ? '#2C3E50' : '#FFFFFF',
        boxShadow: 24,
        p: 4,
        overflow: 'auto',
        color: isDarkMode ? '#F8F9FA' : '#212529'
    };

    const gridTheme = useMemo(() => {
        return themeQuartz
            .withPart(iconSetMaterial)
            .withPart(isDarkMode ? colorSchemeDark : colorSchemeLight);
    }, [isDarkMode]);

    const handleFileUpload = useCallback((file) => {
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        setFileName(file.name);
        setError('');
        setSuccess('');

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setError(`Parse error: ${results.errors[0].message}`);
                    return;
                }

                if (results.data.length === 0) {
                    setError('CSV file is empty');
                    return;
                }

                // Generate column definitions dynamically from CSV headers
                const headers = Object.keys(results.data[0]);
                const cols = headers.map(header => ({
                    field: header,
                    headerName: header,
                    sortable: true,
                    filter: true,
                    resizable: true,
                    flex: 1,
                    minWidth: 150
                }));

                setColumnDefs(cols);
                setRowData(results.data);
                setCsvData(results.data);
            },
            error: (error) => {
                setError(`Error reading file: ${error.message}`);
            }
        });
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleImport = async () => {
        if (!csvData) return;

        try {
            setIsUploading(true);
            setError('');
            setUploadProgress(0);
            setUploadStats(null);

            const CHUNK_THRESHOLD = 5000;
            const useChunkedUpload = csvData.length > CHUNK_THRESHOLD;

            if (useChunkedUpload) {
                const response = await pushDataChunked(csvData, 1000, (progress) => {
                    setUploadProgress(progress.percentage);
                    setUploadStats({
                        current: progress.current,
                        total: progress.total,
                        rowsProcessed: progress.rowsProcessed,
                        totalRows: progress.totalRows
                    });
                });

                setSuccess(`Successfully imported ${response.rowsInserted} rows in ${response.chunks} chunks!`);
            } else {
                const response = await pushData(csvData);
                setSuccess(`Successfully imported ${csvData.length} rows!`);
            }

            if (onDataImport) {
                onDataImport(csvData, columnDefs);
            }

            setTimeout(() => {
                handleClose();
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to import data. Please try again.');
            console.error('Import error:', err);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadStats(null);
        }
    };

    const handleClose = () => {
        setCsvData(null);
        setColumnDefs([]);
        setRowData([]);
        setFileName('');
        setError('');
        setSuccess('');
        setIsDragging(false);
        setIsUploading(false);
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="csv-upload-modal"
        >
            <Box sx={modalStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <Typography variant="h5" component="h2">
                        Import CSV Data
                    </Typography>
                    <Button
                        onClick={handleClose}
                        style={{ minWidth: 'auto', padding: '8px' }}
                        disabled={isUploading}
                    >
                        <X size={20} />
                    </Button>
                </div>

                {!csvData ? (
                    <div>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{
                                border: isDragging
                                    ? `3px dashed ${isDarkMode ? '#007BFF' : '#007BFF'}`
                                    : isDarkMode
                                        ? '2px dashed #495057'
                                        : '2px dashed #CED4DA',
                                borderRadius: '8px',
                                padding: '60px 20px',
                                textAlign: 'center',
                                backgroundColor: isDragging
                                    ? (isDarkMode ? '#34495E' : '#F8F9FA')
                                    : (isDarkMode ? '#34495E' : '#F8F9FA'),
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Upload size={48} style={{ color: isDarkMode ? '#007BFF' : '#007BFF', marginBottom: '16px' }} />
                            <Typography variant="h6" gutterBottom>
                                Drag and drop your CSV file here
                            </Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                or
                            </Typography>
                            <label htmlFor="csv-file-input">
                                <input
                                    id="csv-file-input"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <Button
                                    variant="contained"
                                    component="span"
                                    style={{ marginTop: '16px' }}
                                >
                                    Browse Files
                                </Button>
                            </label>
                        </div>

                        {error && (
                            <div style={{
                                marginTop: '20px',
                                padding: '12px',
                                backgroundColor: isDarkMode ? 'rgba(220, 53, 69, 0.15)' : 'rgba(220, 53, 69, 0.1)',
                                border: `1px solid #DC3545`,
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <AlertCircle size={20} color="#DC3545" />
                                <Typography sx={{ color: '#DC3545' }}>{error}</Typography>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div style={{
                            padding: '12px',
                            backgroundColor: isDarkMode ? '#34495E' : '#F8F9FA',
                            border: `1px solid ${isDarkMode ? '#495057' : '#DEE2E6'}`,
                            borderRadius: '4px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={20} color="#007BFF" />
                                <div>
                                    <Typography variant="body1">
                                        <strong>{fileName}</strong>
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {rowData.length} rows, {columnDefs.length} columns
                                    </Typography>
                                </div>
                            </div>
                            <Button
                                size="small"
                                onClick={() => {
                                    setCsvData(null);
                                    setRowData([]);
                                    setColumnDefs([]);
                                    setFileName('');
                                    setError('');
                                    setSuccess('');
                                }}
                                disabled={isUploading}
                            >
                                Change File
                            </Button>
                        </div>

                        {error && (
                            <div style={{
                                marginBottom: '20px',
                                padding: '12px',
                                backgroundColor: isDarkMode ? 'rgba(220, 53, 69, 0.15)' : 'rgba(220, 53, 69, 0.1)',
                                border: `1px solid #DC3545`,
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <AlertCircle size={20} color="#DC3545" />
                                <Typography sx={{ color: '#DC3545' }}>{error}</Typography>
                            </div>
                        )}

                        {success && (
                            <div style={{
                                marginBottom: '20px',
                                padding: '12px',
                                backgroundColor: isDarkMode ? 'rgba(0, 123, 255, 0.15)' : 'rgba(0, 123, 255, 0.1)',
                                border: `1px solid #007BFF`,
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <CheckCircle size={20} color="#007BFF" />
                                <Typography sx={{ color: '#007BFF' }}>{success}</Typography>
                            </div>
                        )}

                        {isUploading && uploadStats && (
                            <div style={{
                                marginBottom: '20px',
                                padding: '16px',
                                backgroundColor: isDarkMode ? '#34495E' : '#F8F9FA',
                                border: `1px solid ${isDarkMode ? '#495057' : '#DEE2E6'}`,
                                borderRadius: '4px'
                            }}>
                                <Typography variant="body2" gutterBottom>
                                    Uploading: Chunk {uploadStats.current} of {uploadStats.total}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    {uploadStats.rowsProcessed.toLocaleString()} / {uploadStats.totalRows.toLocaleString()} rows processed
                                </Typography>
                                {uploadStats.chunkSize && (
                                    <Typography variant="caption" color="textSecondary" gutterBottom sx={{ display: 'block' }}>
                                        Adaptive chunk size: {uploadStats.chunkSize} rows/chunk
                                    </Typography>
                                )}
                                <LinearProgress
                                    variant="determinate"
                                    value={uploadProgress}
                                    sx={{
                                        marginTop: '8px',
                                        height: '8px',
                                        borderRadius: '4px'
                                    }}
                                />
                                <Typography variant="caption" color="textSecondary" sx={{ marginTop: '4px', display: 'block' }}>
                                    {uploadProgress}% complete
                                </Typography>
                            </div>
                        )}

                        <Typography variant="h6" gutterBottom>
                            Preview Data
                        </Typography>

                        <div style={{ height: 400, width: '100%', marginBottom: '20px' }}>
                            <AgGridReact
                                theme={gridTheme}
                                rowData={rowData}
                                columnDefs={columnDefs}
                                defaultColDef={{
                                    sortable: true,
                                    filter: true,
                                    resizable: true
                                }}
                                pagination={true}
                                paginationPageSize={10}
                                paginationPageSizeSelector={[10, 25, 50, 100]}

                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <Button
                                variant="outlined"
                                onClick={handleClose}
                                disabled={isUploading}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderRadius: '8px',
                                    padding: '6px 16px',
                                    borderColor: isDarkMode ? '#495057' : '#CED4DA',
                                    color: isDarkMode ? '#CED4DA' : '#495057',
                                    '&:hover': {
                                        borderColor: isDarkMode ? '#ADB5BD' : '#ADB5BD',
                                        backgroundColor: isDarkMode ? '#34495E' : '#F8F9FA',
                                    },
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleImport}
                                disabled={isUploading}
                                startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderRadius: '8px',
                                    padding: '6px 16px',
                                }}
                            >
                                {isUploading ? 'Importing...' : 'Import Data'}
                            </Button>
                        </div>
                    </div>
                )}
            </Box>
        </Modal>
    );
}