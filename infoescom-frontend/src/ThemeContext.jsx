// src/ThemeContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

export const ThemeContext = createContext();

export const ThemeProviderCustom = ({ children }) => {
  // Leer el modo del localStorage (si existe) o usar 'light' por defecto
  const storedMode = localStorage.getItem('themeMode') || 'light';
  const [mode, setMode] = useState(storedMode);

  // Actualizar el localStorage cuando el modo cambie
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Crear el tema usando MUI
  const theme = createTheme({
    palette: {
      mode: mode,
      primary: {
        main: '#1976d2',
        light: '#63a4ff',
        dark: '#004ba0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#424242',
        light: '#6d6d6d',
        dark: '#1b1b1b',
        contrastText: '#ffffff',
      },
      error: {
        main: '#d32f2f',
      },
      background: {
        default: mode === 'dark' ? '#1c1c1d' : '#ececec',
        paper: mode === 'dark' ? '#252728' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: '8px', padding: '8px 16px' },
          containedPrimary: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
        },
      },
      MuiTextField: {
        styleOverrides: { root: { marginBottom: '16px' } },
      },
      MuiCard: {
        styleOverrides: { root: { borderRadius: '12px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' } },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: '#009eff',
            fontWeight: 'bold',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },
      },
    },
  });

  // Función para alternar el modo
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
