import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState } from 'react'

import { useAppDispatch } from '../../app/hooks'
import { useCreateListMutation } from '../../features/api/pastaListApi'
import { snackbarShown } from '../../features/ui/uiSlice'

interface CreateListDialogProps {
    open: boolean
    onClose: () => void
}

export default function CreateListDialog({ open, onClose }: CreateListDialogProps) {
    const dispatch = useAppDispatch()
    const [createList, { isLoading }] = useCreateListMutation()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    const close = () => {
        setName('')
        setDescription('')
        onClose()
    }

    const submit = async () => {
        if (name.trim().length === 0) {
            return
        }

        try {
            await createList({ name: name.trim(), description: description.trim() || null }).unwrap()
            dispatch(snackbarShown({ message: 'List created.', severity: 'success' }))
            close()
        } catch {
            dispatch(snackbarShown({ message: 'Could not create the list.', severity: 'error' }))
        }
    }

    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
            <DialogTitle>New shopping list</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        autoFocus
                        label="Name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        multiline
                        minRows={2}
                        fullWidth
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={close}>Cancel</Button>
                <Button variant="contained" onClick={submit} disabled={isLoading || !name.trim()}>
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    )
}
