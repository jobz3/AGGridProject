import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Box from '@mui/material/Box';
import {ChevronLeft, Icon, Type} from 'lucide-react'
import Button from "@mui/material/Button";

export default function DataViewModal({ open, onClose, row }) {

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby='view-data'
            aria-describedby='modal-description '>
        
            <Box sx={modalStyle}>
                <Button variant="text" onClick={onClose}><ChevronLeft /> <Typography> Back </Typography></Button>
                <Typography id="view-data" variant="h6" component="h2" gutterBottom>
                    View Data
                </Typography>
                <Box id="modal-description" sx={{ mt: 2 }}>
                    {row ? (
                        <div>
                            <Typography><strong>Make:</strong> {row.make}</Typography>
                            <Typography><strong>Model:</strong> {row.model}</Typography>
                            <Typography><strong>Price:</strong> ${row.price}</Typography>
                            <Typography><strong>Electric:</strong> {row.electric ? 'Yes' : 'No'}</Typography>
                        </div>
                    ) : (
                        <Typography>No data selected</Typography>
                    )}
                </Box>
            </Box>
        </Modal>
    )

}