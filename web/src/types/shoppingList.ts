export type ShoppingListRole = 'Owner' | 'Editor' | 'Viewer'

export interface ShoppingListSummary {
    id: string
    name: string
    description: string | null
    isArchived: boolean
    itemCount: number
    checkedItemCount: number
    createdAt: string
    updatedAt: string
    role: ShoppingListRole
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
    role: ShoppingListRole
    items: ShoppingListItem[]
}

export interface ShoppingListMember {
    id: string
    userId: string
    email: string
    role: ShoppingListRole
    createdAt: string
}

export interface InviteShoppingListMemberRequest {
    email: string
    role: ShoppingListRole
}

export interface UpdateShoppingListMemberRoleRequest {
    role: ShoppingListRole
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
