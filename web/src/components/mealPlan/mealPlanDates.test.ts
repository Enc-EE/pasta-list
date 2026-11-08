import { describe, expect, it } from 'vitest'

import type { MealPlanEntry } from '../../types/mealPlan'
import {
    buildMealPlanDays,
    entriesForSlot,
    groupEntriesByDate,
    mealPlanRange,
    toLocalDateString,
} from './mealPlanDates'

function createEntry(overrides: Partial<MealPlanEntry> = {}): MealPlanEntry {
    return {
        id: 'entry-1',
        mealPlanId: 'plan-1',
        date: '2026-11-08',
        slot: 'Lunch',
        name: 'Pasta',
        createdAt: '2026-11-08T10:00:00Z',
        updatedAt: '2026-11-08T10:00:00Z',
        ...overrides,
    }
}

describe('toLocalDateString', () => {
    it('formats the local calendar date without applying a UTC offset', () => {
        expect(toLocalDateString(new Date(2026, 10, 8, 23, 30))).toBe('2026-11-08')
        expect(toLocalDateString(new Date(2026, 0, 2, 0, 15))).toBe('2026-01-02')
    })
})

describe('buildMealPlanDays', () => {
    it('builds a contiguous range around the provided day and marks today', () => {
        const days = buildMealPlanDays(new Date(2026, 10, 8, 12), 2, 3)

        expect(days).toHaveLength(6)
        expect(days[0].date).toBe('2026-11-06')
        expect(days[2].date).toBe('2026-11-08')
        expect(days[2].isToday).toBe(true)
        expect(days[5].date).toBe('2026-11-11')
        expect(days[2].weekday).not.toBe('')
        expect(days[2].dateLabel).not.toBe('')
    })
})

describe('mealPlanRange', () => {
    it('returns a range one month in the past and future', () => {
        expect(mealPlanRange(new Date(2026, 10, 8))).toEqual({
            from: '2026-10-09',
            to: '2026-12-08',
        })
    })
})

describe('groupEntriesByDate', () => {
    it('groups entries by their date while preserving order', () => {
        const first = createEntry()
        const second = createEntry({ id: 'entry-2', name: 'Soup', slot: 'Dinner' })
        const otherDay = createEntry({ id: 'entry-3', date: '2026-11-09' })

        const grouped = groupEntriesByDate([first, second, otherDay])

        expect(grouped.get('2026-11-08')?.map((entry) => entry.id)).toEqual(['entry-1', 'entry-2'])
        expect(grouped.get('2026-11-09')?.map((entry) => entry.id)).toEqual(['entry-3'])
    })
})

describe('entriesForSlot', () => {
    it('filters by slot and orders by creation time', () => {
        const later = createEntry({ id: 'later', createdAt: '2026-11-08T12:00:00Z' })
        const earlier = createEntry({ id: 'earlier', createdAt: '2026-11-08T08:00:00Z' })
        const dinner = createEntry({ id: 'dinner', slot: 'Dinner' })

        const lunch = entriesForSlot([later, dinner, earlier], 'Lunch')

        expect(lunch.map((entry) => entry.id)).toEqual(['earlier', 'later'])
    })
})
