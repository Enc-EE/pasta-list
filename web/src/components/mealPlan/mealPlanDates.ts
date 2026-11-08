import type { MealPlanEntry, MealPlanRange, MealPlanSlot } from '../../types/mealPlan'

export const MEAL_PLAN_DAYS_BEFORE = 30
export const MEAL_PLAN_DAYS_AFTER = 30

export interface MealPlanDay {
    date: string
    weekday: string
    dateLabel: string
    isToday: boolean
}

export function startOfLocalDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
    const result = startOfLocalDay(date)
    result.setDate(result.getDate() + days)
    return result
}

export function toLocalDateString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function buildMealPlanDays(
    today = new Date(),
    before = MEAL_PLAN_DAYS_BEFORE,
    after = MEAL_PLAN_DAYS_AFTER,
): MealPlanDay[] {
    const todayKey = toLocalDateString(today)
    const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long' })
    const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long' })
    const days: MealPlanDay[] = []

    for (let offset = -before; offset <= after; offset += 1) {
        const date = addDays(today, offset)
        const key = toLocalDateString(date)

        days.push({
            date: key,
            weekday: weekdayFormatter.format(date),
            dateLabel: dateFormatter.format(date),
            isToday: key === todayKey,
        })
    }

    return days
}

export function mealPlanRange(today = new Date()): MealPlanRange {
    return {
        from: toLocalDateString(addDays(today, -MEAL_PLAN_DAYS_BEFORE)),
        to: toLocalDateString(addDays(today, MEAL_PLAN_DAYS_AFTER)),
    }
}

export function groupEntriesByDate(entries: MealPlanEntry[]): Map<string, MealPlanEntry[]> {
    const grouped = new Map<string, MealPlanEntry[]>()

    for (const entry of entries) {
        const dayEntries = grouped.get(entry.date)
        if (dayEntries) {
            dayEntries.push(entry)
        } else {
            grouped.set(entry.date, [entry])
        }
    }

    return grouped
}

export function entriesForSlot(entries: MealPlanEntry[], slot: MealPlanSlot): MealPlanEntry[] {
    return entries
        .filter((entry) => entry.slot === slot)
        .sort((left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
}
