import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useEffect, useState } from 'react'

import type { MealPlanEntry } from '../../types/mealPlan'

interface EditMealDialogProps {
    entry: MealPlanEntry | null
    onClose: () => void
    onSave: (entry: MealPlanEntry, name: string) => Promise<boolean>
}

export default function EditMealDialog({ entry, onClose, onSave }: EditMealDialogProps) {
    const [name, setName] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setName(entry?.name ?? '')
    }, [entry])

    const save = async () => {
        if (!entry || !name.trim()) {
            return
        }

        setIsSaving(true)
        const saved = await onSave(entry, name.trim())
        setIsSaving(false)

        if (saved) {
            onClose()
        }
    }

    return (
        <Dialog open={entry !== null} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Edit meal</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Meal"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={isSaving || !name.trim()}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
}
