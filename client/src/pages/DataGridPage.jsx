import { useState } from 'react';
import GridView from '../components/DataGrid.jsx';
import CSVUploadModal from '../components/CSVUploadModal.jsx';
import { useThemeMode } from '../context/ThemeContext.jsx';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    AppBar,
    Toolbar,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    UploadFile,
    Dashboard,
    TableChart,
    Brightness4,
    Brightness7,
} from '@mui/icons-material';

export default function DataGridPage() {
    const [open, setOpen] = useState(false);
    const [dataCount, setDataCount] = useState(0);
    const { mode, toggleTheme } = useThemeMode();

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

    const isDarkMode = mode === 'dark';

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            bgcolor: isDarkMode ? '#212529' : '#F0F2F5'
        }}>
            <AppBar
                position="static"
                elevation={0}
                sx={{
                    bgcolor: isDarkMode ? '#2C3E50' : '#FFFFFF',
                    borderBottom: isDarkMode ? '1px solid #34495E' : '1px solid #DEE2E6',
                }}
            >
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            color: isDarkMode ? '#F8F9FA' : '#212529',
                            fontWeight: 600
                        }}
                    >
                        Data Management Dashboard
                    </Typography>
                    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
                        <IconButton
                            onClick={toggleTheme}
                            sx={{ color: isDarkMode ? '#CED4DA' : '#6C757D' }}
                        >
                            {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xxl" sx={{ mt: 4, mb: 4, flex: 1 }}>
                <Box sx={{ mb: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            mb: 3,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: isDarkMode ? '#2C3E50' : '#FFFFFF',
                            borderRadius: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<UploadFile />}
                                onClick={handleOpen}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderRadius: '8px',
                                    padding: '8px 20px',
                                    fontSize: '15px',
                                    bgcolor: isDarkMode ? '#495057' : '#E9ECEF',
                                    color: isDarkMode ? '#F8F9FA' : '#343A40',
                                    '&:hover': {
                                        bgcolor: isDarkMode ? '#3D4449' : '#DEE2E6',
                                    },
                                }}
                            >
                                Upload Data File
                            </Button>

                            {dataCount > 0 && (
                                <Chip
                                    label={`${dataCount} rows imported`}
                                    size="small"
                                    sx={{
                                        bgcolor: isDarkMode ? '#34495E' : '#F8F9FA',
                                        color: isDarkMode ? '#CED4DA' : '#495057',
                                        fontWeight: 500,
                                    }}
                                />
                            )}
                        </Box>
                    </Paper>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        p: 0,
                        borderRadius: 2,
                        bgcolor: isDarkMode ? '#2C3E50' : '#FFFFFF',
                        overflow: 'hidden',
                    }}
                >
                    <GridView />
                </Paper>
            </Container>

            <CSVUploadModal 
                open={open} 
                onClose={handleClose}
                onDataImport={handleDataImport}
            />
        </Box>
    );
}