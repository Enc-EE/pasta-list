import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { useAppDispatch } from '../../app/hooks'
import {
    useToggleItemMutation,
    useUpdateItemPositionMutation,
} from '../../features/api/pastaListApi'
import { snackbarShown } from '../../features/ui/uiSlice'
import type { ShoppingListItem } from '../../types/shoppingList'
import SortableShoppingItem from './SortableShoppingItem'
import { getShoppingItemPositionUpdate } from './shoppingItemOrdering'

export type ShoppingMode = 'edit' | 'shopping'

export interface ShoppingItemListProps {
    listId: string
    items: ShoppingListItem[]
    readOnly?: boolean
    mode?: ShoppingMode
}

export default function ShoppingItemList({
    listId,
    items,
    readOnly = false,
    mode = 'edit',
}: ShoppingItemListProps) {
    const dispatch = useAppDispatch()
    const [updateItemPosition, { isLoading: isReordering }] = useUpdateItemPositionMutation()
    const [toggleItem, { isLoading: isToggling }] = useToggleItemMutation()
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const isMutationPending = isReordering || isToggling
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    useEffect(() => {
        if (mode === 'shopping') {
            setEditingItemId(null)
        }
    }, [mode])

    if (items.length === 0) {
        return <Typography color="text.secondary">Nothing to buy here. Add an item below.</Typography>
    }

    const handleToggle = async (itemId: string) => {
        try {
            await toggleItem({ listId, itemId }).unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not update the item.', severity: 'error' }))
        }
    }

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        if (!over || mode === 'shopping') {
            return
        }

        const positionUpdate = getShoppingItemPositionUpdate(
            items,
            String(active.id),
            String(over.id),
        )
        if (!positionUpdate) {
            return
        }

        try {
            await updateItemPosition({ listId, ...positionUpdate }).unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not reorder the items.', severity: 'error' }))
        }
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <List>
                    {items.map((item) => (
                        <SortableShoppingItem
                            key={item.id}
                            listId={listId}
                            item={item}
                            readOnly={readOnly}
                            mode={mode}
                            isEditing={!readOnly && mode === 'edit' && item.id === editingItemId}
                            isMutationPending={isMutationPending}
                            onEdit={() => setEditingItemId(item.id)}
                            onEditDone={() => setEditingItemId(null)}
                            onToggle={() => handleToggle(item.id)}
                        />
                    ))}
                </List>
            </SortableContext>
        </DndContext>
    )
}
