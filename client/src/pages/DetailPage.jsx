import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Paper, Typography, Button, Divider } from '@mui/material';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useThemeMode } from '../context/ThemeContext.jsx';
import { useState } from 'react';
import DataDeleteModal from '../components/DataDeleteModal.jsx';
import { deleteRows } from '../utils/api.js';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function DetailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { mode } = useThemeMode();
    const isDarkMode = mode === 'dark';
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const row = location.state?.row;

    const formatFieldName = (field) => {
        return field
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
    };

    const formatFieldValue = (value) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleDeleteClick = () => {
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!row || !row.id) {
            setSnackbar({ open: true, message: 'No row selected', severity: 'error' });
            return;
        }

        try {
            setDeleteLoading(true);
            await deleteRows([row.id]);
            setSnackbar({ open: true, message: 'Row deleted successfully', severity: 'success' });
            setDeleteModalOpen(false);
            // Navigate back after successful deletion
            setTimeout(() => {
                navigate(-1);
            }, 1500);
        } catch (error) {
            console.error('Error deleting row:', error);
            setSnackbar({ open: true, message: 'Error deleting row', severity: 'error' });
        } finally {
            setDeleteLoading(false);
        }
    };

    if (!row) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                    bgcolor: isDarkMode ? '#212529' : '#F0F2F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="h5" sx={{ color: isDarkMode ? '#F8F9FA' : '#212529', mb: 2 }}>
                    No data to display
                </Typography>
                <Button
                    variant="contained"
                    onClick={handleBack}
                    sx={{
                        bgcolor: isDarkMode ? '#007BFF' : '#007BFF',
                        '&:hover': {
                            bgcolor: isDarkMode ? '#0056b3' : '#0056b3',
                        },
                    }}
                >
                    Back to Grid
                </Button>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                bgcolor: isDarkMode ? '#212529' : '#F0F2F5',
            }}
        >
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDarkMode ? '#2C3E50' : '#FFFFFF',
                        color: isDarkMode ? '#F8F9FA' : '#212529',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Button
                            variant="text"
                            onClick={handleBack}
                            startIcon={<ChevronLeft size={20} />}
                            sx={{
                                textTransform: 'none',
                                color: isDarkMode ? '#CED4DA' : '#495057',
                                '&:hover': {
                                    backgroundColor: isDarkMode ? '#34495E' : '#F8F9FA',
                                },
                            }}
                        >
                            Back to Grid
                        </Button>

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<Trash2 size={14} />}
                            onClick={handleDeleteClick}
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
                            Delete
                        </Button>
                    </Box>

                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                        View Details
                    </Typography>

                    <Divider sx={{ my: 3, borderColor: isDarkMode ? '#34495E' : '#DEE2E6' }} />

                    <Box sx={{ mt: 3 }}>
                        {Object.entries(row)
                            .filter(([key]) => !['actions', 'created_at'].includes(key))
                            .map(([key, value], index, arr) => (
                                <Box
                                    key={key}
                                    sx={{
                                        mb: 3,
                                        pb: 2.5,
                                        borderBottom:
                                            index < arr.length - 1
                                                ? `1px solid ${isDarkMode ? '#34495E' : '#DEE2E6'}`
                                                : 'none',
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.5px',
                                            mb: 0.5,
                                            color: isDarkMode ? '#ADB5BD' : '#6C757D',
                                        }}
                                    >
                                        {formatFieldName(key)}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            wordBreak: 'break-word',
                                            whiteSpace: 'pre-wrap',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        {formatFieldValue(value)}
                                    </Typography>
                                </Box>
                            ))}
                    </Box>
                </Paper>
            </Container>

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
        </Box>
    );
}
