import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'

import { useAppDispatch } from '../../app/hooks'
import { useCreateItemMutation } from '../../features/api/pastaListApi'
import { snackbarShown } from '../../features/ui/uiSlice'

interface AddItemFormProps {
    listId: string
}

export default function AddItemForm({ listId }: AddItemFormProps) {
    const dispatch = useAppDispatch()
    const [createItem, { isLoading }] = useCreateItemMutation()
    const [name, setName] = useState('')
    const [quantity, setQuantity] = useState('1')
    const [unit, setUnit] = useState('')

    const submit = async (event: FormEvent) => {
        event.preventDefault()

        if (name.trim().length === 0) {
            return
        }

        try {
            await createItem({
                listId,
                body: {
                    name: name.trim(),
                    quantity: Number(quantity) || 1,
                    unit: unit.trim() || null,
                },
            }).unwrap()

            setName('')
            setQuantity('1')
            setUnit('')
        } catch {
            dispatch(snackbarShown({ message: 'Could not add the item.', severity: 'error' }))
        }
    }

    return (
        <Stack component="form" onSubmit={submit} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
                label="Item"
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
                size="small"
            />
            <TextField
                label="Qty"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                sx={{ width: { sm: 100 } }}
                size="small"
            />
            <TextField
                label="Unit"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                sx={{ width: { sm: 120 } }}
                size="small"
            />
            <Button type="submit" variant="contained" disabled={isLoading || !name.trim()}>
                Add
            </Button>
        </Stack>
    )
}

// TODO: add a category picker once categories are curated server side.
