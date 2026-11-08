import { DndContext } from '@dnd-kit/core'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'

import type { MealPlanEntry } from '../../types/mealPlan'
import MealDayCard from './MealDayCard'
import type { MealPlanDay } from './mealPlanDates'

const day: MealPlanDay = {
    date: '2026-11-09',
    weekday: 'Monday',
    dateLabel: '9 November',
    isToday: false,
}

const entry: MealPlanEntry = {
    id: 'entry-1',
    mealPlanId: 'plan-1',
    date: '2026-11-09',
    slot: 'Lunch',
    name: 'Pasta',
    createdAt: '2026-11-09T10:00:00Z',
    updatedAt: '2026-11-09T10:00:00Z',
}

function renderCard(props: Partial<ComponentProps<typeof MealDayCard>> = {}) {
    const onAdd = props.onAdd ?? vi.fn().mockResolvedValue(true)
    const onDelete = props.onDelete ?? vi.fn()
    const onEdit = props.onEdit ?? vi.fn()

    render(
        <DndContext>
            <MealDayCard
                day={day}
                entries={[]}
                canEdit
                onAdd={onAdd}
                onDelete={onDelete}
                onEdit={onEdit}
                {...props}
            />
        </DndContext>,
    )

    return { onAdd, onDelete, onEdit }
}

describe('MealDayCard', () => {
    afterEach(() => cleanup())

    it('renders the day header and lunch before dinner', () => {
        renderCard()

        expect(screen.getByRole('heading', { name: 'Monday' })).toBeInTheDocument()
        expect(screen.getByText('9 November')).toBeInTheDocument()

        const lunch = screen.getByRole('heading', { name: 'Lunch' })
        const dinner = screen.getByRole('heading', { name: 'Dinner' })

        expect(lunch.compareDocumentPosition(dinner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('adds a lunch meal and clears the input for the next meal', async () => {
        const user = userEvent.setup()
        const { onAdd } = renderCard()

        const lunchSection = screen.getByLabelText('Lunch meals')
        await user.click(within(lunchSection).getByRole('button', { name: 'Add' }))

        const form = screen.getByRole('form', { name: 'Add lunch meal' })
        const input = within(form).getByRole('textbox', { name: 'Lunch meal' })
        await user.type(input, 'Pasta')
        await user.click(within(form).getByRole('button', { name: 'Add' }))

        await waitFor(() => {
            expect(onAdd).toHaveBeenCalledWith('2026-11-09', 'Lunch', 'Pasta')
        })
        await waitFor(() => {
            expect(input).toHaveValue('')
        })
    })

    it('deletes a meal through the chip delete control', async () => {
        const user = userEvent.setup()
        const onDelete = vi.fn()
        renderCard({ entries: [entry], onDelete })

        const chip = screen.getByRole('button', { name: 'Pasta' })
        await user.click(within(chip).getByTestId('CancelIcon'))

        expect(onDelete).toHaveBeenCalledWith(entry)
    })

    it('hides edit, add and delete controls for read-only access', () => {
        renderCard({ entries: [entry], canEdit: false })

        expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Pasta' })).not.toBeInTheDocument()
        expect(screen.queryByTestId('CancelIcon')).not.toBeInTheDocument()
    })
})
