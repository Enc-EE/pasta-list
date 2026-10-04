import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { useAppDispatch } from '../../app/hooks'
import { useCreateItemMutation } from '../../features/api/pastaListApi'
import { snackbarShown } from '../../features/ui/uiSlice'
import QuantityInput from './QuantityInput'

export interface AddItemFormProps {
    listId: string
    onClose: () => void
}

export default function AddItemForm({ listId, onClose }: AddItemFormProps) {
    const dispatch = useAppDispatch()
    const [createItem, { isLoading }] = useCreateItemMutation()
    const nameInputRef = useRef<HTMLInputElement>(null)
    const [name, setName] = useState('')
    const [quantity, setQuantity] = useState('1')

    const submit = async (event: FormEvent) => {
        event.preventDefault()

        if (name.trim().length === 0) {
            return
        }

        nameInputRef.current?.focus({ preventScroll: true })

        try {
            await createItem({
                listId,
                body: {
                    name: name.trim(),
                    quantity: Number(quantity) || 1,
                    unit: null,
                },
            }).unwrap()

            setName('')
            setQuantity('1')
        } catch {
            dispatch(snackbarShown({ message: 'Could not add the item.', severity: 'error' }))
        }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose()
        }
    }

    return (
        <Stack
            component="form"
            onSubmit={submit}
            onKeyDown={handleKeyDown}
            aria-label="Add item"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
        >
            <TextField
                label="Item"
                value={name}
                onChange={(event) => setName(event.target.value)}
                inputRef={nameInputRef}
                autoFocus
                fullWidth
                size="small"
            />
            <QuantityInput value={quantity} onChange={setQuantity} />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading || !name.trim()}
                    onPointerDown={(event) => {
                        if (event.isPrimary && event.button === 0) {
                            event.preventDefault()
                        }
                    }}
                    sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                    Add
                </Button>
                <IconButton aria-label="Stop adding items" onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Stack>
        </Stack>
    )
}

// TODO: add a category picker once categories are curated server side.
