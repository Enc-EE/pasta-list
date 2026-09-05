import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

import { pastaListApi } from '../features/api/pastaListApi'
import uiReducer from '../features/ui/uiSlice'

export const store = configureStore({
    reducer: {
        [pastaListApi.reducerPath]: pastaListApi.reducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(pastaListApi.middleware),
})

// Enables refetchOnFocus / refetchOnReconnect behaviour.
setupListeners(store.dispatch)

export type AppStore = typeof store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
