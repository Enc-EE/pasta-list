export interface ShoppingListSummary {
    id: string
    name: string
    description: string | null
    isArchived: boolean
    itemCount: number
    checkedItemCount: number
    createdAt: string
    updatedAt: string
}

export interface ShoppingListItem {
    id: string
    shoppingListId: string
    name: string
    quantity: number
    unit: string | null
    category: string | null
    note: string | null
    isChecked: boolean
    sortOrder: number
}

export interface ShoppingList {
    id: string
    name: string
    description: string | null
    isArchived: boolean
    createdAt: string
    updatedAt: string
    items: ShoppingListItem[]
}

export interface CreateShoppingListRequest {
    name: string
    description?: string | null
}

export interface UpdateShoppingListRequest {
    name: string
    description?: string | null
    isArchived: boolean
}

export interface CreateShoppingListItemRequest {
    name: string
    quantity: number
    unit?: string | null
    category?: string | null
    note?: string | null
}

export type UpdateShoppingListItemRequest = CreateShoppingListItemRequest & {
    isChecked: boolean
    sortOrder: number
}
