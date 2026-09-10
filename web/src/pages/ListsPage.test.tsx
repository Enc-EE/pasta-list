import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import ListsPage from './ListsPage'

vi.mock('../features/api/pastaListApi', () => ({
    useGetListsQuery: () => ({
        data: [
            {
                id: 'list-1',
                name: 'Pasta Night',
                description: 'Dinner ingredients',
                isArchived: false,
                itemCount: 4,
                checkedItemCount: 2,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                role: 'Owner',
            },
        ],
        isLoading: false,
        isError: false,
    }),
}))

vi.mock('../components/lists/CreateListDialog', () => ({
    default: () => null,
}))

describe('ListsPage', () => {
    afterEach(() => cleanup())

    it('renders list progress and ownership role', () => {
        render(<MemoryRouter><ListsPage /></MemoryRouter>)

        expect(screen.getByRole('heading', { name: 'Your lists' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Pasta Night' })).toBeInTheDocument()
        expect(screen.getByText('Owner')).toBeInTheDocument()
        expect(screen.getByText('2 of 4 done')).toBeInTheDocument()
    })
})
