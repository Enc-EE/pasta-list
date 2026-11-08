import type { ShoppingListRole } from './shoppingList'

export type MealPlanSlot = 'Lunch' | 'Dinner'

export interface MealPlanEntry {
    id: string
    mealPlanId: string
    date: string
    slot: MealPlanSlot
    name: string
    createdAt: string
    updatedAt: string
}

export interface MealPlan {
    id: string
    role: ShoppingListRole
    createdAt: string
    updatedAt: string
    entries: MealPlanEntry[]
}

export interface MealPlanMember {
    id: string
    userId: string
    email: string
    role: ShoppingListRole
    createdAt: string
}

export interface MealPlanRange {
    from: string
    to: string
}

export interface CreateMealPlanEntryRequest {
    date: string
    slot: MealPlanSlot
    name: string
}

export interface UpdateMealPlanEntryRequest {
    name: string
}

export interface MoveMealPlanEntryRequest {
    date: string
    slot: MealPlanSlot
}

export interface InviteMealPlanMemberRequest {
    email: string
    role: ShoppingListRole
}

export interface UpdateMealPlanMemberRoleRequest {
    role: ShoppingListRole
}
