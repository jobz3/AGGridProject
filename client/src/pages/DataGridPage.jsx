import { useState } from 'react';
import GridView from '../components/DataGrid';
import CSVUploadModal from '../components/CSVUploadModal';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    AppBar,
    Toolbar,
    Chip,
} from '@mui/material';
import {
    UploadFile,
    Dashboard,
    TableChart,
} from '@mui/icons-material';

export default function DataGridPage() {
    const [open, setOpen] = useState(false);
    const [dataCount, setDataCount] = useState(0);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleDataImport = (data) => {
        console.log(data);
        setDataCount(data?.length);
        // Refresh the grid after import
        window.location.reload();
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
            {/* App Bar */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 600 }}>
                        Data Management Dashboard
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    {/* Action Bar */}
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 2, 
                            mb: 3, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            border: '1px solid #e0e0e0'
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<UploadFile />}
                                onClick={handleOpen}
                                size="large"
                            >
                                Upload CSV
                            </Button>
                            
                            {dataCount > 0 && (
                                <Chip 
                                    label={`${dataCount} rows imported`} 
                                    color="info" 
                                    size="small" 
                                />
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* Data Grid Section */}
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 3, 
                        borderRadius: 2,
                        border: '1px solid #e0e0e0'
                    }}
                >
                    <GridView />
                </Paper>
            </Container>

            {/* CSV Upload Modal */}
            <CSVUploadModal 
                open={open} 
                onClose={handleClose}
                onDataImport={handleDataImport}
            />
        </Box>
    );
}