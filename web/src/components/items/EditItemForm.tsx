import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent, type KeyboardEvent } from 'react'

import { useAppDispatch } from '../../app/hooks'
import { useUpdateItemMutation } from '../../features/api/pastaListApi'
import { snackbarShown } from '../../features/ui/uiSlice'
import type { ShoppingListItem } from '../../types/shoppingList'
import QuantityInput from './QuantityInput'

export interface EditItemFormProps {
    listId: string
    item: ShoppingListItem
    onDone: () => void
}

export default function EditItemForm({ listId, item, onDone }: EditItemFormProps) {
    const dispatch = useAppDispatch()
    const [updateItem, { isLoading }] = useUpdateItemMutation()
    const [name, setName] = useState(item.name)
    const [quantity, setQuantity] = useState(String(item.quantity))

    const submit = async (event: FormEvent) => {
        event.preventDefault()

        if (name.trim().length === 0) {
            return
        }

        try {
            // PUT replaces the whole item, so fields this form does not edit are sent unchanged.
            await updateItem({
                listId,
                itemId: item.id,
                body: {
                    name: name.trim(),
                    quantity: Number(quantity) || 1,
                    unit: item.unit,
                    category: item.category,
                    note: item.note,
                    isChecked: item.isChecked,
                    sortOrder: item.sortOrder,
                },
            }).unwrap()

            onDone()
        } catch {
            dispatch(snackbarShown({ message: 'Could not save the item.', severity: 'error' }))
        }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onDone()
        }
    }

    return (
        <Stack
            component="form"
            onSubmit={submit}
            onKeyDown={handleKeyDown}
            aria-label={`Edit ${item.name}`}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ width: '100%', py: 1 }}
        >
            <TextField
                label="Item"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
                fullWidth
                size="small"
            />
            <QuantityInput value={quantity} onChange={setQuantity} />
            <Stack direction="row" spacing={1}>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading || !name.trim()}
                    sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                    Save
                </Button>
                <Button onClick={onDone} sx={{ flex: { xs: 1, sm: 'none' } }}>
                    Cancel
                </Button>
            </Stack>
        </Stack>
    )
}
