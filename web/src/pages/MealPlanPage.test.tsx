import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { MealPlan, MealPlanEntry } from '../types/mealPlan'
import { toLocalDateString } from '../components/mealPlan/mealPlanDates'
import MealPlanPage from './MealPlanPage'

const mocks = vi.hoisted(() => ({
    getMealPlan: vi.fn(),
    createMealPlan: vi.fn(),
    deleteMealPlan: vi.fn(),
    createEntry: vi.fn(),
    updateEntry: vi.fn(),
    moveEntry: vi.fn(),
    deleteEntry: vi.fn(),
}))

vi.mock('../app/hooks', () => ({
    useAppDispatch: () => vi.fn(),
}))

vi.mock('../features/api/pastaListApi', () => ({
    useGetMealPlanQuery: mocks.getMealPlan,
    useCreateMealPlanMutation: () => [mocks.createMealPlan, { isLoading: false }],
    useDeleteMealPlanMutation: () => [mocks.deleteMealPlan, { isLoading: false }],
    useCreateMealPlanEntryMutation: () => [mocks.createEntry, { isLoading: false }],
    useUpdateMealPlanEntryMutation: () => [mocks.updateEntry, { isLoading: false }],
    useMoveMealPlanEntryMutation: () => [mocks.moveEntry, { isLoading: false }],
    useDeleteMealPlanEntryMutation: () => [mocks.deleteEntry, { isLoading: false }],
    useGetMealPlanMembersQuery: () => ({ data: [], isLoading: false }),
    useInviteMealPlanMemberMutation: () => [vi.fn(), { isLoading: false }],
    useUpdateMealPlanMemberRoleMutation: () => [vi.fn(), { isLoading: false }],
    useRemoveMealPlanMemberMutation: () => [vi.fn(), { isLoading: false }],
}))

vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: ({ count }: { count: number }) => ({
        getTotalSize: () => count * 200,
        getVirtualItems: () => Array.from({ length: count }, (_, index) => ({
            index,
            key: index,
            start: index * 200,
            size: 200,
        })),
        measureElement: () => undefined,
        scrollToIndex: vi.fn(),
    }),
}))

const entry: MealPlanEntry = {
    id: 'entry-1',
    mealPlanId: 'plan-1',
    date: toLocalDateString(new Date()),
    slot: 'Lunch',
    name: 'Pasta',
    createdAt: '2026-11-09T10:00:00Z',
    updatedAt: '2026-11-09T10:00:00Z',
}

const plan: MealPlan = {
    id: 'plan-1',
    role: 'Owner',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-08T10:00:00Z',
    entries: [entry],
}

describe('MealPlanPage', () => {
    beforeEach(() => {
        mocks.getMealPlan.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: { status: 404 },
        })
        mocks.createMealPlan.mockReturnValue({
            unwrap: () => Promise.resolve(plan),
        })
    })

    afterEach(() => {
        cleanup()
        vi.clearAllMocks()
    })

    it('offers to create a plan when the user has none', async () => {
        const user = userEvent.setup()
        render(<MealPlanPage />)

        expect(screen.getByText('Plan your lunches and dinners')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Create meal plan' }))

        expect(mocks.createMealPlan).toHaveBeenCalledTimes(1)
    })

    it('renders a shared plan read-only for viewers', () => {
        mocks.getMealPlan.mockReturnValue({
            data: { ...plan, role: 'Viewer' },
            isLoading: false,
            isError: false,
        })

        render(<MealPlanPage />)

        expect(screen.getByText('You have view-only access to this meal plan.')).toBeInTheDocument()
        expect(screen.getByText('Pasta')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Pasta' })).not.toBeInTheDocument()
    })

    it('shows owner controls for the owned plan', () => {
        mocks.getMealPlan.mockReturnValue({
            data: plan,
            isLoading: false,
            isError: false,
        })

        render(<MealPlanPage />)

        expect(screen.getByRole('button', { name: 'Members' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
        expect(screen.queryByText('You have view-only access to this meal plan.')).not.toBeInTheDocument()
    })
})
