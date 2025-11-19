import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { AgGridReact } from 'ag-grid-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import DataViewModal from './DataViewModal';
import FilterModal from './FilterModal';
import DataDeleteModal from './DataDeleteModal';
import { getData, searchData, filterData, deleteRows } from '../utils/api.js';
import { Search, Filter, RefreshCw, Trash2 } from 'lucide-react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Filter1, FilterList, SearchOutlined, Visibility } from '@mui/icons-material';

const ActionCell = (props) => {
    const { data, context } = props;

    const onView = (e) => {
        e.stopPropagation();
        context.openModal(data);
    };

    const onDelete = (e) => {
        e.stopPropagation();
        context.openDeleteModal(data);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
            <Button size='small' variant='outlined' onClick={onView}>
                <Visibility fontSize='20'/>
                View
            </Button>
            <Button
                size='small'
                variant='outlined'
                color='error'
                onClick={onDelete}
                startIcon={<Trash2 size={14} />}
            >
                Delete
            </Button>
        </div>
    );
};

export default function DataGrid() {
    const [modalOpen, setModalOpen] = useState(false);
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState([]);
    const [columns, setColumns] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const openModal = useCallback((row) => {
        setSelectedRow(row);
        setModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setSelectedRow(null);
    }, []);

    const openDeleteModal = useCallback((row) => {
        setSelectedRow(row);
        setDeleteModalOpen(true);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getData();

            if (data && data.rows && data.rows.length > 0) {
                const rows = data.rows;
                setRowData(rows);

                const keys = Object.keys(rows[0]).filter(key => !['created_at'].includes(key));
                setColumns(keys.filter(k => k !== 'id'));

                const dynamicColDefs = keys.filter(k => k !== 'id').map(key => ({
                    field: key,
                    headerName: key.charAt(0).toUpperCase() + key.slice(1),
                }));

                dynamicColDefs.push({
                    field: 'actions',
                    headerName: 'Actions',
                    pinned: 'right',
                    width: 200,
                    cellRenderer: ActionCell,
                    sortable: false,
                    filter: false
                });

                setColDefs(dynamicColDefs);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setSnackbar({ open: true, message: 'Error loading data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = useCallback(async (query) => {
        if (!query.trim()) {
            fetchData();
            return;
        }

        try {
            setLoading(true);
            const data = await searchData(query);
            setRowData(data.rows || []);
        } catch (error) {
            console.error('Error searching:', error);
            setSnackbar({ open: true, message: 'Error searching data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [fetchData]);

    const handleApplyFilters = useCallback(async (filters) => {
        setActiveFilters(filters);

        try {
            setLoading(true);
            const data = await filterData(filters);
            setRowData(data.rows || []);
        } catch (error) {
            console.error('Error filtering:', error);
            setSnackbar({ open: true, message: 'Error filtering data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        const timer = setTimeout(() => {
            handleSearch(query);
        }, 500);

        return () => clearTimeout(timer);
    };

    const handleRefresh = () => {
        setSearchQuery('');
        setActiveFilters([]);
        fetchData();
    };

    const handleDeleteClick = (row) => {
        setSelectedRow(row);
        setModalOpen(false);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedRow || !selectedRow.id) {
            setSnackbar({ open: true, message: 'No row selected', severity: 'error' });
            return;
        }

        try {
            setDeleteLoading(true);
            await deleteRows([selectedRow.id]);
            setSnackbar({ open: true, message: 'Row deleted successfully', severity: 'success' });
            setDeleteModalOpen(false);
            setSelectedRow(null);
            // Refresh data
            fetchData();
        } catch (error) {
            console.error('Error deleting row:', error);
            setSnackbar({ open: true, message: 'Error deleting row', severity: 'error' });
        } finally {
            setDeleteLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        filter: false,
        flex: 1,
        minWidth: 150,
    }), []);

    const context = useMemo(() => ({
        openModal,
        openDeleteModal
    }), [openModal]);

    return (
        <>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Search across all columns..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    sx={{ flex: 1, maxWidth: 400 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                {/* <Search size={20} /> */}
                                <SearchOutlined fontSize='20'/>
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    variant="outlined"
                    startIcon={<FilterList fontSize='20' />}
                    onClick={() => setFilterModalOpen(true)}
                >
                    Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<RefreshCw size={16} />}
                    onClick={handleRefresh}
                >
                    Refresh
                </Button>
            </div>

            <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={colDefs}
                    context={context}
                    defaultColDef={defaultColDef}
                    rowHeight={50}
                    animateRows={true}
                    loading={loading}
                    headerHeight={75}
                />
            </div>

            <DataViewModal
                open={modalOpen}
                row={selectedRow}
                onClose={closeModal}
                onDelete={handleDeleteClick}
            />

            <FilterModal
                open={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                columns={columns}
                onApplyFilters={handleApplyFilters}
            />

            <DataDeleteModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                rowCount={1}
                loading={deleteLoading}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}