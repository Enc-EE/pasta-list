import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { useAppSelector } from './app/hooks'
import RequireAuth from './components/auth/RequireAuth'
import AppLayout from './components/layout/AppLayout'
import ListDetailPage from './pages/ListDetailPage'
import ListsPage from './pages/ListsPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import { buildTheme } from './theme/theme'

export default function App() {
  const themeMode = useAppSelector((state) => state.ui.themeMode)
  const theme = useMemo(() => buildTheme(themeMode), [themeMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<ListsPage />} />
            <Route path="lists" element={<Navigate to="/" replace />} />
            <Route path="lists/:listId" element={<ListDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  )
}
