import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useGetMeQuery } from '../../features/api/pastaListApi'

// Wraps the authenticated area of the app; unauthenticated visitors land on /login.
export default function RequireAuth() {
    const location = useLocation()
    const { isLoading, isError } = useGetMeQuery()

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (isError) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <Outlet />
}
