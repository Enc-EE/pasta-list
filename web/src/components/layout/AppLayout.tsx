import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LogoutIcon from '@mui/icons-material/Logout'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useState, type MouseEvent } from 'react'
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { useGetMeQuery, useLogoutMutation } from '../../features/api/pastaListApi'
import { themeModeToggled } from '../../features/ui/uiSlice'
import AppSnackbar from './AppSnackbar'

export default function AppLayout() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const themeMode = useAppSelector((state) => state.ui.themeMode)
    const { data: currentUser } = useGetMeQuery()
    const [logout] = useLogoutMutation()
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

    const closeMenu = () => setMenuAnchor(null)

    const handleLogout = async () => {
        closeMenu()
        await logout()
        navigate('/login', { replace: true })
    }

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
                    {currentUser && (
                        <IconButton
                            color="inherit"
                            onClick={(event: MouseEvent<HTMLElement>) => setMenuAnchor(event.currentTarget)}
                            aria-label="Account menu"
                        >
                            <Avatar sx={{ width: 32, height: 32 }}>
                                {currentUser.email.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                    )}
                    <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
                        <MenuItem disabled>
                            <ListItemText primary={currentUser?.email} secondary="Signed in" />
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Sign out" />
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
                <Outlet />
            </Container>

            <AppSnackbar />
        </Box>
    )
}
