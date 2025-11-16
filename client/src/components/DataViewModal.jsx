import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Box from '@mui/material/Box';
import { ChevronLeft } from 'lucide-react';
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

export default function DataViewModal({ open, onClose, row }) {

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

    // Format field name: convert snake_case or camelCase to Title Case
    const formatFieldName = (field) => {
        return field
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/_/g, ' ') // Replace underscores with spaces
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
    };

    // Format field value
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

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby='view-data'
            aria-describedby='modal-description'>
        
            <Box sx={modalStyle}>
                <Button 
                    variant="text" 
                    onClick={onClose}
                    sx={{ mb: 2, p: 0.5 }}
                >
                    <ChevronLeft size={20} /> 
                    <Typography sx={{ ml: 0.5 }}>Back</Typography>
                </Button>

                <Typography id="view-data" variant="h5" component="h2" gutterBottom>
                    View Data
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box id="modal-description" sx={{ mt: 2 }}>
                    {row ? (
                        <Box>
                            {Object.entries(row)
                                .filter(([key]) => key !== 'actions') // Filter out the actions field
                                .map(([key, value], index) => (
                                    <Box 
                                        key={key} 
                                        sx={{ 
                                            mb: 2.5,
                                            pb: 2,
                                            borderBottom: index < Object.keys(row).length - 2 ? '1px solid #f0f0f0' : 'none'
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