import { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeMode must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Initialize mode from localStorage or default to 'light'
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode === 'dark' ? 'dark' : 'light';
    });

    // Save mode to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    ...(mode === 'light'
                        ? {
                              // Light mode colors
                              primary: {
                                  main: '#007BFF',
                              },
                              secondary: {
                                  main: '#DC3545',
                              },
                              background: {
                                  default: '#F0F2F5',
                                  paper: '#FFFFFF',
                              },
                              text: {
                                  primary: '#212529',
                                  secondary: '#6C757D',
                              },
                          }
                        : {
                              // Dark mode colors
                              primary: {
                                  main: '#007BFF',
                              },
                              secondary: {
                                  main: '#DC3545',
                              },
                              background: {
                                  default: '#212529',
                                  paper: '#2C3E50',
                              },
                              text: {
                                  primary: '#F8F9FA',
                                  secondary: '#ADB5BD',
                              },
                          }),
                },
                components: {
                    MuiAppBar: {
                        styleOverrides: {
                            root: {
                                backgroundColor: mode === 'light' ? '#FFFFFF' : '#2C3E50',
                                borderBottom: mode === 'light' ? '1px solid #DEE2E6' : '1px solid #34495E',
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                border: mode === 'light' ? '1px solid #DEE2E6' : '1px solid #34495E',
                            },
                        },
                    },
                },
            }),
        [mode]
    );

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
