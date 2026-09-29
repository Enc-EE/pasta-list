import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ShoppingListItem } from '../../types/shoppingList'
import ShoppingItemList from './ShoppingItemList'

const updateItem = vi.fn()

vi.mock('../../app/hooks', () => ({
    useAppDispatch: () => vi.fn(),
}))

vi.mock('../../features/api/pastaListApi', () => ({
    useToggleItemMutation: () => [vi.fn()],
    useDeleteItemMutation: () => [vi.fn()],
    useUpdateItemMutation: () => [updateItem, { isLoading: false }],
}))

const item: ShoppingListItem = {
    id: 'item-1',
    shoppingListId: 'list-1',
    name: 'Penne',
    quantity: 2,
    unit: 'kg',
    category: null,
    note: 'whole wheat',
    isChecked: false,
    sortOrder: 0,
}

describe('ShoppingItemList', () => {
    afterEach(() => {
        cleanup()
        updateItem.mockReset()
    })

    it('edits an item inline and keeps fields the form does not show', async () => {
        updateItem.mockReturnValue({ unwrap: () => Promise.resolve() })
        const user = userEvent.setup()
        render(<ShoppingItemList listId="list-1" items={[item]} />)

        await user.click(screen.getByRole('button', { name: 'Edit Penne' }))

        const nameField = screen.getByRole('textbox', { name: 'Item' })
        expect(nameField).toHaveFocus()
        await user.clear(nameField)
        await user.type(nameField, 'Fusilli')
        await user.click(screen.getByRole('button', { name: 'Quantity 4' }))
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(updateItem).toHaveBeenCalledWith({
            listId: 'list-1',
            itemId: 'item-1',
            body: {
                name: 'Fusilli',
                quantity: 4,
                unit: 'kg',
                category: null,
                note: 'whole wheat',
                isChecked: false,
                sortOrder: 0,
            },
        })
        expect(await screen.findByRole('button', { name: 'Edit Penne' })).toBeInTheDocument()
    })

    it('hides edit controls for read-only lists', () => {
        render(<ShoppingItemList listId="list-1" items={[item]} readOnly />)

        expect(screen.queryByRole('button', { name: 'Edit Penne' })).not.toBeInTheDocument()
    })
})
