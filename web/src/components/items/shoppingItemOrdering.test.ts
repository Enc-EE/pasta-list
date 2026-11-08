import { describe, expect, it } from 'vitest'

import type { ShoppingListItem } from '../../types/shoppingList'
import { getShoppingItemPositionUpdate } from './shoppingItemOrdering'

const items: ShoppingListItem[] = ['a', 'b', 'c', 'd'].map((id, index) => ({
    id,
    shoppingListId: 'list-1',
    name: id.toUpperCase(),
    quantity: 1,
    unit: null,
    category: null,
    note: null,
    isChecked: false,
    sortOrder: (index + 1) * 1000,
}))

describe('getShoppingItemPositionUpdate', () => {
    it('moves an item between its new neighbors', () => {
        expect(getShoppingItemPositionUpdate(items, 'a', 'c')).toEqual({
            itemId: 'a',
            body: { previousItemId: 'c', nextItemId: 'd' },
            orderedItemIds: ['b', 'c', 'a', 'd'],
        })
    })

    it('moves an item to the top', () => {
        expect(getShoppingItemPositionUpdate(items, 'c', 'a')).toEqual({
            itemId: 'c',
            body: { previousItemId: null, nextItemId: 'a' },
            orderedItemIds: ['c', 'a', 'b', 'd'],
        })
    })

    it('moves an item to the bottom', () => {
        expect(getShoppingItemPositionUpdate(items, 'b', 'd')).toEqual({
            itemId: 'b',
            body: { previousItemId: 'd', nextItemId: null },
            orderedItemIds: ['a', 'c', 'd', 'b'],
        })
    })

    it('ignores unchanged and unknown drops', () => {
        expect(getShoppingItemPositionUpdate(items, 'a', 'a')).toBeNull()
        expect(getShoppingItemPositionUpdate(items, 'missing', 'a')).toBeNull()
        expect(getShoppingItemPositionUpdate(items, 'a', 'missing')).toBeNull()
    })
})
