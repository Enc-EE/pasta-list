import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ThemeMode = 'light' | 'dark'

interface UiState {
    themeMode: ThemeMode
    hideCheckedItems: boolean
    snackbar: { message: string; severity: 'success' | 'error' | 'info' } | null
}

const initialState: UiState = {
    themeMode: 'light',
    hideCheckedItems: false,
    snackbar: null,
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        themeModeToggled: (state) => {
            state.themeMode = state.themeMode === 'light' ? 'dark' : 'light'
        },
        hideCheckedItemsToggled: (state) => {
            state.hideCheckedItems = !state.hideCheckedItems
        },
        snackbarShown: (state, action: PayloadAction<NonNullable<UiState['snackbar']>>) => {
            state.snackbar = action.payload
        },
        snackbarDismissed: (state) => {
            state.snackbar = null
        },
    },
})

export const {
    themeModeToggled,
    hideCheckedItemsToggled,
    snackbarShown,
    snackbarDismissed,
} = uiSlice.actions

export default uiSlice.reducer

// TODO: persist themeMode in localStorage.
