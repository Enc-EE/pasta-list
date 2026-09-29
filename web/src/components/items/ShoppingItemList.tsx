import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import { useAppDispatch } from '../../app/hooks'
import { useDeleteItemMutation, useToggleItemMutation } from '../../features/api/pastaListApi'
import { snackbarShown } from '../../features/ui/uiSlice'
import type { ShoppingListItem } from '../../types/shoppingList'
import EditItemForm from './EditItemForm'

interface ShoppingItemListProps {
    listId: string
    items: ShoppingListItem[]
    readOnly?: boolean
}

export default function ShoppingItemList({ listId, items, readOnly = false }: ShoppingItemListProps) {
    const dispatch = useAppDispatch()
    const [toggleItem] = useToggleItemMutation()
    const [deleteItem] = useDeleteItemMutation()
    const [editingItemId, setEditingItemId] = useState<string | null>(null)

    if (items.length === 0) {
        return (
            <Typography color="text.secondary">Nothing to buy here. Add an item below.</Typography>
        )
    }

    const remove = async (itemId: string) => {
        try {
            await deleteItem({ listId, itemId }).unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not delete the item.', severity: 'error' }))
        }
    }

    return (
        <List disablePadding>
            {items.map((item) =>
                !readOnly && item.id === editingItemId ? (
                    <ListItem key={item.id} disablePadding>
                        <EditItemForm listId={listId} item={item} onDone={() => setEditingItemId(null)} />
                    </ListItem>
                ) : (
                    <ListItem
                        key={item.id}
                        disablePadding
                        secondaryAction={
                            readOnly ? undefined : (
                                <Stack direction="row">
                                    <IconButton aria-label={`Edit ${item.name}`} onClick={() => setEditingItemId(item.id)}>
                                        <EditOutlinedIcon />
                                    </IconButton>
                                    <IconButton edge="end" aria-label={`Delete ${item.name}`} onClick={() => remove(item.id)}>
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                </Stack>
                            )
                        }
                    >
                        <ListItemButton
                            onClick={() => !readOnly && toggleItem({ listId, itemId: item.id })}
                            disabled={readOnly}
                            dense
                            sx={{ pr: readOnly ? undefined : 12 }}
                        >
                            <ListItemIcon>
                                <Checkbox edge="start" checked={item.isChecked} tabIndex={-1} disableRipple />
                            </ListItemIcon>
                            <ListItemText
                                primary={item.name}
                                secondary={[item.quantity, item.unit].filter(Boolean).join(' ')}
                                sx={{
                                    textDecoration: item.isChecked ? 'line-through' : 'none',
                                    opacity: item.isChecked ? 0.6 : 1,
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ),
            )}
        </List>
    )
}

// TODO: support drag & drop reordering using SortOrder.
