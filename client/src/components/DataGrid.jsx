import Button from '@mui/material/Button';
import { AgGridReact } from 'ag-grid-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import DataViewModal from './DataViewModal';
import { getData } from '../utils/api.js';

// Move ActionCell outside to prevent recreation on every render
const ActionCell = (props) => {
    const { data, context } = props;

    const onView = (e) => {
        e.stopPropagation();
        context.openModal(data);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Button size='small' variant='outlined' onClick={onView}>
                View
            </Button>
        </div>
    );
};

export default function DataGrid() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);

    const openModal = useCallback((row) => {
        setSelectedRow(row);
        setModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setSelectedRow(null);
    }, []);

    useEffect(() => {
        const getDataFromTable = async () => {
            try {
                setLoading(true);
                const data = await getData();
                console.log('API Response:', data);
                
                // Check if data and rows exist
                if (data && data.rows && data.rows.length > 0) {
                    const rows = data.rows;
                    
                    // Set row data
                    setRowData(rows);
                    
                    // Create column definitions from keys
                    const keys = Object.keys(rows[0]);
                    const dynamicColDefs = keys.map(key => ({
                        field: key,
                        headerName: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize header
                    }));
                    
                    // Add actions column
                    dynamicColDefs.push({
                        field: 'actions',
                        headerName: 'Actions',
                        pinned: 'right',
                        width: 140,
                        cellRenderer: ActionCell,
                        sortable: false,
                        filter: false
                    });
                    
                    setColDefs(dynamicColDefs);
                } else {
                    console.log('No data returned from API');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        getDataFromTable();
    }, []);

    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        filter: true,
        flex: 1,
    }), []);

    const context = useMemo(() => ({
        openModal
    }), [openModal]);

    return (
        <>
            <div className="ag-theme-quartz" style={{ height: 500, width: '100%' }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={colDefs}
                    context={context}
                    defaultColDef={defaultColDef}
                    rowHeight={50}
                    animateRows={true}
                    loading={loading}
                />
            </div>

            <DataViewModal
                open={modalOpen}
                row={selectedRow}
                onClose={closeModal}
            />
        </>
    );
}