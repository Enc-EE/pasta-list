import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type {
    CurrentUser,
    RequestLoginCodeRequest,
    VerifyLoginCodeRequest,
} from '../../types/auth'
import type {
    CreateShoppingListItemRequest,
    CreateShoppingListRequest,
    InviteShoppingListMemberRequest,
    ShoppingList,
    ShoppingListItem,
    ShoppingListMember,
    ShoppingListSummary,
    UpdateShoppingListItemRequest,
    UpdateShoppingListMemberRoleRequest,
    UpdateShoppingListRequest,
} from '../../types/shoppingList'

// Vite proxies /api to the .NET API in development (see vite.config.ts).
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

// Same-origin BFF: the session cookie is sent automatically, never read from JS.
const rawBaseQuery = fetchBaseQuery({ baseUrl, credentials: 'same-origin' })

const baseQueryWithSessionHandling: typeof rawBaseQuery = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions)

    if (result.error?.status === 401) {
        // Drop the stale session so the route guard falls back to the login screen.
        api.dispatch(pastaListApi.util.invalidateTags([{ type: 'Session', id: 'CURRENT' }]))
    }

    return result
}

export const pastaListApi = createApi({
    reducerPath: 'pastaListApi',
    baseQuery: baseQueryWithSessionHandling,
    tagTypes: ['ShoppingList', 'ShoppingListItem', 'ShoppingListMember', 'Session'],
    endpoints: (builder) => ({
        getMe: builder.query<CurrentUser, void>({
            query: () => 'auth/me',
            providesTags: [{ type: 'Session', id: 'CURRENT' }],
        }),

        requestLoginCode: builder.mutation<void, RequestLoginCodeRequest>({
            query: (body) => ({ url: 'auth/request-code', method: 'POST', body }),
        }),

        verifyLoginCode: builder.mutation<CurrentUser, VerifyLoginCodeRequest>({
            query: (body) => ({ url: 'auth/verify', method: 'POST', body }),
            invalidatesTags: [{ type: 'Session', id: 'CURRENT' }, { type: 'ShoppingList', id: 'LIST' }],
        }),

        logout: builder.mutation<void, void>({
            query: () => ({ url: 'auth/logout', method: 'POST' }),
            invalidatesTags: [{ type: 'Session', id: 'CURRENT' }, { type: 'ShoppingList', id: 'LIST' }],
        }),

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

        getMembers: builder.query<ShoppingListMember[], string>({
            query: (listId) => `lists/${listId}/members`,
            providesTags: (result, _error, listId) => [
                { type: 'ShoppingListMember' as const, id: listId },
                ...(result ?? []).map((member) => ({ type: 'ShoppingListMember' as const, id: member.id })),
            ],
        }),

        inviteMember: builder.mutation<
            ShoppingListMember | undefined,
            { listId: string; body: InviteShoppingListMemberRequest }
        >({
            query: ({ listId, body }) => ({
                url: `lists/${listId}/members`,
                method: 'POST',
                body,
                // A pending invitation (no account yet) returns 202 with an empty body.
                responseHandler: (response: Response) =>
                    (response.status === 202 ? Promise.resolve(undefined) : response.json()),
            }),
            invalidatesTags: (_result, _error, { listId }) => [{ type: 'ShoppingListMember', id: listId }],
        }),

        updateMemberRole: builder.mutation<
            void,
            { listId: string; userId: string; body: UpdateShoppingListMemberRoleRequest }
        >({
            query: ({ listId, userId, body }) => ({
                url: `lists/${listId}/members/${userId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _error, { listId }) => [
                { type: 'ShoppingListMember', id: listId },
                { type: 'ShoppingList', id: listId },
            ],
        }),

        removeMember: builder.mutation<void, { listId: string; userId: string }>({
            query: ({ listId, userId }) => ({
                url: `lists/${listId}/members/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, { listId }) => [
                { type: 'ShoppingListMember', id: listId },
                { type: 'ShoppingList', id: 'LIST' },
            ],
        }),
    }),
})

export const {
    useGetMeQuery,
    useRequestLoginCodeMutation,
    useVerifyLoginCodeMutation,
    useLogoutMutation,
    useGetListsQuery,
    useGetListQuery,
    useCreateListMutation,
    useUpdateListMutation,
    useDeleteListMutation,
    useCreateItemMutation,
    useUpdateItemMutation,
    useToggleItemMutation,
    useDeleteItemMutation,
    useGetMembersQuery,
    useInviteMemberMutation,
    useUpdateMemberRoleMutation,
    useRemoveMemberMutation,
} = pastaListApi
