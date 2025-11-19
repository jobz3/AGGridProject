import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { AlertTriangle } from 'lucide-react';
import { Warning } from '@mui/icons-material';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
};

export default function DataDeleteModal({ 
    open, 
    onClose, 
    onConfirm, 
    rowCount = 1,
    loading = false 
}) {
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
                            bgcolor: '#fee', 
                            borderRadius: '50%', 
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <AlertTriangle size={28} color="#d32f2f" />
                    </Box>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                        Confirm Deletion
                    </Typography>
                </Box>

                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                    Are you sure you want to delete{' '}
                    <strong>{rowCount}</strong> {rowCount === 1 ? 'row' : 'rows'}? 
                    This action cannot be undone.
                </Typography>

                <Box sx={{ 
                    bgcolor: '#fff3e0', 
                    border: '1px solid #ff9800',
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
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        color="error"
                        onClick={onConfirm}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}