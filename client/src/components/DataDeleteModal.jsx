import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { AlertTriangle } from 'lucide-react';
import { Warning } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext.jsx';

export default function DataDeleteModal({
    open,
    onClose,
    onConfirm,
    rowCount = 1,
    loading = false
}) {
    const { mode } = useThemeMode();
    const isDarkMode = mode === 'dark';

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        bgcolor: isDarkMode ? '#2C3E50' : '#FFFFFF',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        color: isDarkMode ? '#F8F9FA' : '#212529'
    };
    return (
        <Modal
            open={open}
            onClose={!loading ? onClose : undefined}
            aria-labelledby="delete-confirm-modal"
        >
            <Box sx={modalStyle}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                        sx={{
                            bgcolor: isDarkMode ? 'rgba(220, 53, 69, 0.15)' : 'rgba(220, 53, 69, 0.1)',
                            borderRadius: '50%',
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <AlertTriangle size={28} color="#DC3545" />
                    </Box>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                        Confirm Deletion
                    </Typography>
                </Box>

                <Typography variant="body1" sx={{ mb: 3, color: isDarkMode ? '#ADB5BD' : '#6C757D' }}>
                    Are you sure you want to delete{' '}
                    <strong>{rowCount}</strong> {rowCount === 1 ? 'row' : 'rows'}?
                    This action cannot be undone.
                </Typography>

                <Box sx={{
                    bgcolor: isDarkMode ? 'rgba(220, 53, 69, 0.1)' : 'rgba(220, 53, 69, 0.05)',
                    border: `1px solid #DC3545`,
                    borderRadius: 1,
                    p: 2,
                    mb: 3
                }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Warning/> <strong>Warning:</strong> This will permanently remove the selected data from the database.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        disabled={loading}
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
                        onClick={onConfirm}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            borderRadius: '8px',
                            padding: '6px 16px',
                            bgcolor: '#DC3545',
                            color: '#FFFFFF',
                            '&:hover': {
                                bgcolor: '#c82333',
                            },
                        }}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}