import { useState } from 'react';
import GridView from '../components/DataGrid';
import Button from '@mui/material/Button';
import CSVUploadModal from '../components/CSVUploadModal'
import Box from '@mui/material/Box';
import { Upload } from 'lucide-react';
export default function DataGridPage() {
    const [open, setOpen] = useState(false)
    function onView() {
        setOpen(!open);
    }
     const style = {
        width: '20rem',
        bgcolor: 'background.paper',
        p: 1,
    };

    function onClose() {
        setOpen(false);
    }
    return (
        <>
            <Box sx={style}>
                <Button style={{}} onClick={onView}><Upload /> Upload Data via CSV</Button>
            </Box>
            <GridView />
            <CSVUploadModal open={open} onClose={onClose}></CSVUploadModal>
        </>
    )
}
