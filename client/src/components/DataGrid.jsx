import Button from '@mui/material/Button';
import { AgGridReact } from 'ag-grid-react';
import { useState, useCallback, useMemo } from 'react';
import DataViewModal from './DataViewModal';

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

    const openModal = useCallback((row) => {
        setSelectedRow(row);
        setModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setSelectedRow(null);
    }, []);

    const rowData = useMemo(() => [
        { make: "Tesla", model: "Model Y", price: 64950, electric: true },
        { make: "Ford", model: "F-Series", price: 33850, electric: false },
        { make: "Toyota", model: "Corolla", price: 29600, electric: false },
    ], []);

    const colDefs = useMemo(() => [
        { field: "make" },
        { field: "model" },
        { field: "price" },
        { field: "electric" },
        {
            field: 'actions',
            headerName: 'Actions',
            pinned: 'right',
            width: 140,
            cellRenderer: ActionCell,
            sortable: false,
            filter: false
        }
    ], []);

    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        filter: true
    }), []);

    const context = useMemo(() => ({
        openModal
    }), [openModal]);

    return (
        <>
            <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={colDefs}
                    context={context}
                    defaultColDef={defaultColDef}
                    rowHeight={50}
                    animateRows={true}
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