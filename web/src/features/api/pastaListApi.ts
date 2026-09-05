import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type {
    CreateShoppingListItemRequest,
    CreateShoppingListRequest,
    ShoppingList,
    ShoppingListItem,
    ShoppingListSummary,
    UpdateShoppingListItemRequest,
    UpdateShoppingListRequest,
} from '../../types/shoppingList'

// Vite proxies /api to the .NET API in development (see vite.config.ts).
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const pastaListApi = createApi({
    reducerPath: 'pastaListApi',
    baseQuery: fetchBaseQuery({ baseUrl }),
    tagTypes: ['ShoppingList', 'ShoppingListItem'],
    endpoints: (builder) => ({
        getLists: builder.query<ShoppingListSummary[], { includeArchived?: boolean } | void>({
            query: (args) => ({
                url: 'lists',
                params: { includeArchived: args?.includeArchived ?? false },
            }),
            providesTags: (result) => [
                { type: 'ShoppingList' as const, id: 'LIST' },
                ...(result ?? []).map(({ id }) => ({ type: 'ShoppingList' as const, id })),
            ],
        }),

        getList: builder.query<ShoppingList, string>({
            query: (id) => `lists/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'ShoppingList', id }],
        }),

        createList: builder.mutation<ShoppingList, CreateShoppingListRequest>({
            query: (body) => ({ url: 'lists', method: 'POST', body }),
            invalidatesTags: [{ type: 'ShoppingList', id: 'LIST' }],
        }),

        updateList: builder.mutation<ShoppingList, { id: string; body: UpdateShoppingListRequest }>({
            query: ({ id, body }) => ({ url: `lists/${id}`, method: 'PUT', body }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'ShoppingList', id },
                { type: 'ShoppingList', id: 'LIST' },
            ],
        }),

        deleteList: builder.mutation<void, string>({
            query: (id) => ({ url: `lists/${id}`, method: 'DELETE' }),
            invalidatesTags: [{ type: 'ShoppingList', id: 'LIST' }],
        }),

        createItem: builder.mutation<
            ShoppingListItem,
            { listId: string; body: CreateShoppingListItemRequest }
        >({
            query: ({ listId, body }) => ({ url: `lists/${listId}/items`, method: 'POST', body }),
            invalidatesTags: (_result, _error, { listId }) => [{ type: 'ShoppingList', id: listId }],
        }),

        updateItem: builder.mutation<
            ShoppingListItem,
            { listId: string; itemId: string; body: UpdateShoppingListItemRequest }
        >({
            query: ({ listId, itemId, body }) => ({
                url: `lists/${listId}/items/${itemId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _error, { listId }) => [{ type: 'ShoppingList', id: listId }],
        }),

        toggleItem: builder.mutation<ShoppingListItem, { listId: string; itemId: string }>({
            query: ({ listId, itemId }) => ({
                url: `lists/${listId}/items/${itemId}/toggle`,
                method: 'PATCH',
            }),
            // Optimistic update so the checkbox feels instant.
            async onQueryStarted({ listId, itemId }, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    pastaListApi.util.updateQueryData('getList', listId, (draft) => {
                        const item = draft.items.find((i) => i.id === itemId)
                        if (item) {
                            item.isChecked = !item.isChecked
                        }
                    }),
                )

                try {
                    await queryFulfilled
                } catch {
                    patch.undo()
                }
            },
            invalidatesTags: (_result, _error, { listId }) => [{ type: 'ShoppingList', id: 'LIST' }, { type: 'ShoppingList', id: listId }],
        }),

        deleteItem: builder.mutation<void, { listId: string; itemId: string }>({
            query: ({ listId, itemId }) => ({
                url: `lists/${listId}/items/${itemId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, { listId }) => [{ type: 'ShoppingList', id: listId }],
        }),
    }),
})

export const {
    useGetListsQuery,
    useGetListQuery,
    useCreateListMutation,
    useUpdateListMutation,
    useDeleteListMutation,
    useCreateItemMutation,
    useUpdateItemMutation,
    useToggleItemMutation,
    useDeleteItemMutation,
} = pastaListApi
