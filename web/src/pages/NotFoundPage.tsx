import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFoundPage() {
    return (
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h1">Page not found</Typography>
            <Typography color="text.secondary">This page went missing, like the last meatball.</Typography>
            <Button component={RouterLink} to="/" variant="contained">
                Back to your lists
            </Button>
        </Stack>
    )
}
