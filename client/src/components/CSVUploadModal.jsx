import { useState, useCallback } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { AgGridReact } from 'ag-grid-react';
import Papa from 'papaparse';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getData } from '../utils/api';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 1200,
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    overflow: 'auto'
};

export default function CSVUploadModal({ open, onClose, onDataImport }) {
    const [csvData, setCsvData] = useState(null);
    const [columnDefs, setColumnDefs] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const handleFileUpload = useCallback((file) => {
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        setFileName(file.name);
        setError('');

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

    const handleImport = () => {
        if (csvData && onDataImport) {
            onDataImport(csvData, columnDefs);
            handleClose();
        }
    };

    const handleClose = () => {
        setCsvData(null);
        setColumnDefs([]);
        setRowData([]);
        setFileName('');
        setError('');
        setIsDragging(false);
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
                    <Button onClick={handleClose} style={{ minWidth: 'auto', padding: '8px' }}>
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
                                border: isDragging ? '3px dashed #1976d2' : '2px dashed #ccc',
                                borderRadius: '8px',
                                padding: '60px 20px',
                                textAlign: 'center',
                                backgroundColor: isDragging ? '#e3f2fd' : '#fafafa',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Upload size={48} style={{ color: '#1976d2', marginBottom: '16px' }} />
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
                                backgroundColor: '#ffebee', 
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <AlertCircle size={20} color="#c62828" />
                                <Typography color="error">{error}</Typography>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#e8f5e9', 
                            borderRadius: '4px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={20} color="#2e7d32" />
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
                                }}
                            >
                                Change File
                            </Button>
                        </div>

                        <Typography variant="h6" gutterBottom>
                            Preview Data
                        </Typography>

                        <div className="ag-theme-alpine" style={{ height: 400, width: '100%', marginBottom: '20px' }}>
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={columnDefs}
                                defaultColDef={{
                                    sortable: true,
                                    filter: true,
                                    resizable: true
                                }}
                                pagination={true}
                                paginationPageSize={10}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <Button variant="outlined" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={getData}>
                                Import Data
                            </Button>
                        </div>
                    </div>
                )}
            </Box>
        </Modal>
    );
}

