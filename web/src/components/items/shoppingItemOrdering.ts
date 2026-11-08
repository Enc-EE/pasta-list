import { arrayMove } from '@dnd-kit/sortable'

import type {
    ShoppingListItem,
    UpdateShoppingListItemPositionRequest,
} from '../../types/shoppingList'

export interface ShoppingItemPositionUpdate {
    itemId: string
    body: UpdateShoppingListItemPositionRequest
    orderedItemIds: string[]
}

export function getShoppingItemPositionUpdate(
    items: ShoppingListItem[],
    activeId: string,
    overId: string,
): ShoppingItemPositionUpdate | null {
    if (activeId === overId) {
        return null
    }

    const oldIndex = items.findIndex((item) => item.id === activeId)
    const newIndex = items.findIndex((item) => item.id === overId)
    if (oldIndex < 0 || newIndex < 0) {
        return null
    }

    const reorderedItems = arrayMove(items, oldIndex, newIndex)
    const previousItem = reorderedItems[newIndex - 1]
    const nextItem = reorderedItems[newIndex + 1]

    return {
        itemId: activeId,
        body: {
            previousItemId: previousItem?.id ?? null,
            nextItemId: nextItem?.id ?? null,
        },
        orderedItemIds: reorderedItems.map((item) => item.id),
    }
}
