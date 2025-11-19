import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { AgGridReact } from 'ag-grid-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import DataViewModal from './DataViewModal.jsx';
import FilterModal from './FilterModal.jsx';
import DataDeleteModal from './DataDeleteModal.jsx';
import { getData, searchData, filterData, deleteRows } from '../utils/api.js';
    import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Delete, Filter1, FilterList, Refresh, SearchOutlined, Visibility } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext.jsx';
import { themeQuartz, colorSchemeDark, colorSchemeLight, iconSetMaterial } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import './DataGrid.css';
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
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '100%',
            padding: '8px 0'
        }}>
            <Button
                size='small'
                variant='contained'
                onClick={onView}
                startIcon={<Visibility sx={{ fontSize: 16 }} />}
                sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '6px',
                    bgcolor: '#007BFF',
                    color: '#FFFFFF',
                    padding: '4px 12px',
                    '&:hover': {
                        bgcolor: '#0056b3',
                    },
                }}
            >
                View
            </Button>
            <Button
                size='small'
                variant='contained'
                onClick={onDelete}
                startIcon={<Delete size={14} />}
                sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '6px',
                    bgcolor: '#DC3545',
                    color: '#FFFFFF',
                    padding: '4px 12px',
                    '&:hover': {
                        bgcolor: '#c82333',
                    },
                }}
            >
                Remove
            </Button>
        </div>
    );
};

export default function DataGrid() {
    const { mode } = useThemeMode();
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
                    headerName: key.replace(/_/g, ' ').toUpperCase(),
                    cellStyle: { display: 'flex', alignItems: 'center' },
                    autoHeight: false,
                }));

                dynamicColDefs.push({
                    field: 'actions',
                    headerName: 'ACTIONS',
                    pinned: 'right',
                    width: 220,
                    cellRenderer: ActionCell,
                    sortable: false,
                    filter: false,
                    cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
                });

                setColDefs(dynamicColDefs);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setSnackbar({ open: true, message: 'Error loading data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [mode]);

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
        wrapHeaderText: true,
        autoHeaderHeight: true,
        cellStyle: { display: 'flex', alignItems: 'center' },
    }), []);

    const context = useMemo(() => ({
        openModal,
        openDeleteModal
    }), [openModal]);

    const gridTheme = useMemo(() => {
        return themeQuartz
            .withPart(iconSetMaterial)
            .withPart(mode === 'dark' ? colorSchemeDark : colorSchemeLight);
    }, [mode]);

    return (
        <>
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '0',
                padding: '16px 20px',
                backgroundColor: mode === 'dark' ? '#2C3E50' : '#FFFFFF',
                borderRadius: '12px 12px 0 0',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                    <TextField
                        size="small"
                        placeholder="Search across all columns..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        sx={{
                            width: '350px',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                backgroundColor: mode === 'dark' ? '#34495E' : '#FFFFFF',
                                '& fieldset': {
                                    borderColor: mode === 'dark' ? '#495057' : '#CED4DA',
                                },
                                '&:hover fieldset': {
                                    borderColor: mode === 'dark' ? '#495057' : '#ADB5BD',
                                },
                            },
                            '& input::placeholder': {
                                color: mode === 'dark' ? '#ADB5BD' : '#6C757D',
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlined fontSize='small' sx={{ color: mode === 'dark' ? '#CED4DA' : '#6C757D' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant="outlined"
                            startIcon={<FilterList fontSize='small' />}
                            onClick={() => setFilterModalOpen(true)}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                borderRadius: '8px',
                                padding: '6px 16px',
                                borderColor: mode === 'dark' ? '#495057' : '#CED4DA',
                                color: mode === 'dark' ? '#CED4DA' : '#495057',
                                '&:hover': {
                                    borderColor: mode === 'dark' ? '#ADB5BD' : '#ADB5BD',
                                    backgroundColor: mode === 'dark' ? '#34495E' : '#F8F9FA',
                                },
                            }}
                        >
                            Filter Options {activeFilters.length > 0 && `(${activeFilters.length})`}
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<Refresh size={16} />}
                            onClick={handleRefresh}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                borderRadius: '8px',
                                padding: '6px 16px',
                                borderColor: mode === 'dark' ? '#495057' : '#CED4DA',
                                color: mode === 'dark' ? '#CED4DA' : '#495057',
                                '&:hover': {
                                    borderColor: mode === 'dark' ? '#ADB5BD' : '#ADB5BD',
                                    backgroundColor: mode === 'dark' ? '#34495E' : '#F8F9FA',
                                },
                            }}
                        >
                            Refresh Data
                        </Button>

                    </div>
                </div>
            </div>

            <div
                className="ag-theme-quartz"
                data-dark-mode={mode === 'dark'}
                style={{
                    height: 'calc(100vh - 300px)',
                    minHeight: '500px',
                    width: '100%',
                    borderRadius: '0 0 12px 12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                <AgGridReact
                    theme={gridTheme}
                    rowData={rowData}
                    columnDefs={colDefs}
                    context={context}
                    defaultColDef={defaultColDef}
                    rowHeight={52}
                    animateRows={true}
                    loading={loading}
                    headerHeight={56}
                    suppressCellFocus={true}
                    pagination={true}
                    paginationPageSize={10}
                    paginationPageSizeSelector={[10, 25, 50, 100]}
                    rowClass="ag-row"
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