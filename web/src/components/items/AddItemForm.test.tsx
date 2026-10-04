import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AddItemForm from './AddItemForm'

const createItem = vi.fn()

vi.mock('../../app/hooks', () => ({
    useAppDispatch: () => vi.fn(),
}))

vi.mock('../../features/api/pastaListApi', () => ({
    useCreateItemMutation: () => [createItem, { isLoading: false }],
}))

describe('AddItemForm', () => {
    afterEach(() => {
        cleanup()
        createItem.mockReset()
    })

    it('focuses the item field and stays ready for the next item after adding', async () => {
        createItem.mockReturnValue({ unwrap: () => Promise.resolve() })
        const user = userEvent.setup()
        render(<AddItemForm listId="list-1" onClose={vi.fn()} />)

        const itemField = screen.getByRole('textbox', { name: 'Item' })
        expect(itemField).toHaveFocus()

        await user.type(itemField, 'Penne')
        await user.click(screen.getByRole('button', { name: 'Add' }))

        expect(createItem).toHaveBeenCalledWith({
            listId: 'list-1',
            body: { name: 'Penne', quantity: 1, unit: null },
        })
        await waitFor(() => expect(itemField).toHaveValue(''))
        expect(itemField).toHaveFocus()
    })

    it('focuses the item field before the save completes', async () => {
        let finishSave = () => {}
        const pendingSave = new Promise<void>((resolve) => {
            finishSave = resolve
        })
        createItem.mockReturnValue({ unwrap: () => pendingSave })
        const user = userEvent.setup()
        render(<AddItemForm listId="list-1" onClose={vi.fn()} />)

        const itemField = screen.getByRole('textbox', { name: 'Item' })
        await user.type(itemField, 'Penne')
        await user.click(screen.getByRole('button', { name: 'Quantity 3' }))
        expect(itemField).not.toHaveFocus()
        await user.click(screen.getByRole('button', { name: 'Add' }))

        expect(createItem).toHaveBeenCalledOnce()
        expect(itemField).toHaveFocus()
        expect(itemField).toHaveValue('Penne')

        finishSave()
        await waitFor(() => expect(itemField).toHaveValue(''))
        expect(itemField).toHaveFocus()
    })

    it('keeps the item field focused while pressing Add', async () => {
        createItem.mockReturnValue({ unwrap: () => Promise.resolve() })
        const user = userEvent.setup()
        render(<AddItemForm listId="list-1" onClose={vi.fn()} />)

        const itemField = screen.getByRole('textbox', { name: 'Item' })
        await user.type(itemField, 'Penne')
        await user.pointer({
            target: screen.getByRole('button', { name: 'Add' }),
            keys: '[MouseLeft>]',
        })

        expect(itemField).toHaveFocus()
        await user.pointer({ keys: '[/MouseLeft]' })
        await waitFor(() => expect(itemField).toHaveValue(''))
    })

    it('sets the quantity from a quick quantity button', async () => {
        createItem.mockReturnValue({ unwrap: () => Promise.resolve() })
        const user = userEvent.setup()
        render(<AddItemForm listId="list-1" onClose={vi.fn()} />)

        await user.type(screen.getByRole('textbox', { name: 'Item' }), 'Tomatoes')
        await user.click(screen.getByRole('button', { name: 'Quantity 3' }))
        await user.click(screen.getByRole('button', { name: 'Add' }))

        expect(createItem).toHaveBeenCalledWith({
            listId: 'list-1',
            body: { name: 'Tomatoes', quantity: 3, unit: null },
        })
    })

    it('closes via the close button', async () => {
        const onClose = vi.fn()
        const user = userEvent.setup()
        render(<AddItemForm listId="list-1" onClose={onClose} />)

        await user.click(screen.getByRole('button', { name: 'Stop adding items' }))

        expect(onClose).toHaveBeenCalledOnce()
    })
})
