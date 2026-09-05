import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'

import { useAppDispatch } from '../../app/hooks'
import { useDeleteItemMutation, useToggleItemMutation } from '../../features/api/pastaListApi'
import { snackbarShown } from '../../features/ui/uiSlice'
import type { ShoppingListItem } from '../../types/shoppingList'

interface ShoppingItemListProps {
    listId: string
    items: ShoppingListItem[]
}

export default function ShoppingItemList({ listId, items }: ShoppingItemListProps) {
    const dispatch = useAppDispatch()
    const [toggleItem] = useToggleItemMutation()
    const [deleteItem] = useDeleteItemMutation()

    if (items.length === 0) {
        return (
            <Typography color="text.secondary">Nothing to buy here. Add an item above.</Typography>
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
            {items.map((item) => (
                <ListItem
                    key={item.id}
                    disablePadding
                    secondaryAction={
                        <IconButton edge="end" aria-label={`Delete ${item.name}`} onClick={() => remove(item.id)}>
                            <DeleteOutlineIcon />
                        </IconButton>
                    }
                >
                    <ListItemButton onClick={() => toggleItem({ listId, itemId: item.id })} dense>
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
            ))}
        </List>
    )
}

// TODO: support drag & drop reordering using SortOrder.
