import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Box from '@mui/material/Box';
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { ChevronLeft, Trash2 } from 'lucide-react';

export default function DataViewModal({ open, onClose, row, onDelete }) {

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        maxHeight: '80vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        overflow: 'auto',
        borderRadius: 2,
    };

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

    const handleDelete = () => {
        if (onDelete && row) {
            onDelete(row);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby='view-data'
            aria-describedby='modal-description'>
        
            <Box sx={modalStyle}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Button 
                        variant="text" 
                        onClick={onClose}
                        sx={{ p: 0.5 }}
                    >
                        <ChevronLeft size={20} /> 
                        <Typography sx={{ ml: 0.5 }}>Back</Typography>
                    </Button>

                    <Button 
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Trash2 size={16} />}
                        onClick={handleDelete}
                    >
                        Delete
                    </Button>
                </Box>

                <Typography id="view-data" variant="h5" component="h2" gutterBottom>
                    View Data
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box id="modal-description" sx={{ mt: 2 }}>
                    {row ? (
                        <Box>
                            {Object.entries(row)
                                .filter(([key]) => !['actions', 'created_at'].includes(key))
                                .map(([key, value], index, arr) => (
                                    <Box 
                                        key={key} 
                                        sx={{ 
                                            mb: 2.5,
                                            pb: 2,
                                            borderBottom: index < arr.length - 1 ? '1px solid #f0f0f0' : 'none'
                                        }}
                                    >
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{ 
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                fontSize: '0.75rem',
                                                letterSpacing: '0.5px',
                                                mb: 0.5
                                            }}
                                        >
                                            {formatFieldName(key)}
                                        </Typography>
                                        <Typography 
                                            variant="body1"
                                            sx={{ 
                                                wordBreak: 'break-word',
                                                whiteSpace: 'pre-wrap'
                                            }}
                                        >
                                            {formatFieldValue(value)}
                                        </Typography>
                                    </Box>
                                ))}
                        </Box>
                    ) : (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No data selected
                        </Typography>
                    )}
                </Box>
            </Box>
        </Modal>
    );
}