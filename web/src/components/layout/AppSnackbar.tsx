import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { snackbarDismissed } from '../../features/ui/uiSlice'

export default function AppSnackbar() {
    const dispatch = useAppDispatch()
    const snackbar = useAppSelector((state) => state.ui.snackbar)

    return (
        <Snackbar
            open={snackbar !== null}
            autoHideDuration={4000}
            onClose={() => dispatch(snackbarDismissed())}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert
                severity={snackbar?.severity ?? 'info'}
                variant="filled"
                onClose={() => dispatch(snackbarDismissed())}
            >
                {snackbar?.message}
            </Alert>
        </Snackbar>
    )
}
