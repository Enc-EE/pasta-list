import { createTheme, type Theme } from '@mui/material/styles'

import type { ThemeMode } from '../features/ui/uiSlice'

export const buildTheme = (mode: ThemeMode): Theme =>
    createTheme({
        palette: {
            mode,
            primary: { main: '#c8632f' },
            secondary: { main: '#4c7a4f' },
            background:
                mode === 'light'
                    ? { default: '#fdf8f1', paper: '#ffffff' }
                    : { default: '#1a1614', paper: '#241f1c' },
        },
        shape: { borderRadius: 12 },
        typography: {
            fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
            h1: { fontSize: '2rem', fontWeight: 700 },
            h2: { fontSize: '1.5rem', fontWeight: 600 },
        },
        components: {
            MuiButton: {
                defaultProps: { disableElevation: true },
            },
        },
    })
