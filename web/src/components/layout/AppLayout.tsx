import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, Outlet } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { themeModeToggled } from '../../features/ui/uiSlice'
import AppSnackbar from './AppSnackbar'

export default function AppLayout() {
    const dispatch = useAppDispatch()
    const themeMode = useAppSelector((state) => state.ui.themeMode)

    return (
        <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="sticky" color="primary">
                <Toolbar>
                    <RestaurantIcon sx={{ mr: 1.5 }} />
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/"
                        sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', fontWeight: 700 }}
                    >
                        Pasta List
                    </Typography>
                    <IconButton
                        color="inherit"
                        onClick={() => dispatch(themeModeToggled())}
                        aria-label="Toggle color mode"
                    >
                        {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
                <Outlet />
            </Container>

            <AppSnackbar />
        </Box>
    )
}
