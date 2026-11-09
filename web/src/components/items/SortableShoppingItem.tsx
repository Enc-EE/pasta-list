import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import IconButton from '@mui/material/IconButton'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'

import type { ShoppingListItem } from '../../types/shoppingList'
import EditItemForm from './EditItemForm'
import type { ShoppingMode } from './ShoppingItemList'

export interface SortableShoppingItemProps {
    listId: string
    item: ShoppingListItem
    readOnly: boolean
    mode: ShoppingMode
    isEditing: boolean
    isMutationPending: boolean
    onEdit: () => void
    onEditDone: () => void
    onToggle: () => void
}

export default function SortableShoppingItem({
    listId,
    item,
    readOnly,
    mode,
    isEditing,
    isMutationPending,
    onEdit,
    onEditDone,
    onToggle,
}: SortableShoppingItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
        disabled: readOnly || mode === 'shopping' || isEditing || isMutationPending,
    })

    if (isEditing) {
        return (
            <ListItem disablePadding>
                <EditItemForm listId={listId} item={item} onDone={onEditDone} />
            </ListItem>
        )
    }

    return (
        <ListItem
            ref={setNodeRef}
            sx={{
                transform: CSS.Transform.toString(transform),
                transition,
                boxShadow: isDragging ? 4 : 2,
                marginBottom: 0.5,
                backgroundColor: (theme) =>
                    item.isChecked
                        ? theme.palette.success.light
                        : isDragging
                          ? theme.palette.background.paper
                          : undefined,
                opacity: isDragging ? 0.8 : 1,
                position: 'relative',
                zIndex: isDragging ? 1 : undefined,
            }}
            disablePadding
        >
            <ListItemText
                primary={item.quantity === 1 ? item.name : `${item.quantity} ${item.name}`}
                slotProps={{ primary: { noWrap: true } }}
                sx={{ px: 2, py: 1 }}
            />
            {readOnly ? null : (
                <Stack direction="row" spacing={1} sx={{ pr: 2, flexShrink: 0 }}>
                    {mode === 'edit' ? (
                        <>
                            <IconButton
                                {...attributes}
                                {...listeners}
                                disabled={isMutationPending}
                                disableRipple
                                sx={{
                                    color: 'text.disabled',
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    touchAction: 'none',
                                    '&:hover': {
                                        backgroundColor: 'transparent',
                                        color: 'text.secondary',
                                    },
                                }}
                                aria-label={`Reorder ${item.name}`}
                            >
                                <DragIndicatorIcon />
                            </IconButton>
                            <IconButton
                                sx={{
                                    boxShadow: 2,
                                }}
                                aria-label={`Edit ${item.name}`}
                                disabled={isMutationPending}
                                onClick={onEdit}
                            >
                                <EditOutlinedIcon />
                            </IconButton>
                        </>
                    ) : (
                        <IconButton
                            sx={{
                                boxShadow: 2,
                            }}
                            aria-label={`Check ${item.name}`}
                            disabled={isMutationPending}
                            onClick={onToggle}
                        >
                            <CheckOutlinedIcon />
                        </IconButton>
                    )}
                </Stack>
            )}
        </ListItem>
    )
}
