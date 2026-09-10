import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import LoginPage from './LoginPage'

const requestCode = vi.fn()
const verifyCode = vi.fn()

vi.mock('../features/api/pastaListApi', () => ({
    useRequestLoginCodeMutation: () => [requestCode, { isLoading: false, error: null }],
    useVerifyLoginCodeMutation: () => [verifyCode, { isLoading: false, error: null }],
}))

describe('LoginPage', () => {
    afterEach(() => cleanup())

    beforeEach(() => {
        requestCode.mockReset()
        verifyCode.mockReset()
        requestCode.mockResolvedValue({ unwrap: async () => undefined })
        verifyCode.mockResolvedValue({ unwrap: async () => ({ id: 'user-1' }) })
    })

    it('requests a code and advances to verification', async () => {
        const user = userEvent.setup()
        render(<MemoryRouter><LoginPage /></MemoryRouter>)

        await user.type(screen.getByLabelText(/Email/), 'person@example.com')
        await user.click(screen.getByRole('button', { name: 'Send code' }))

        expect(requestCode).toHaveBeenCalledWith({ email: 'person@example.com' })
        expect(await screen.findByLabelText(/Verification code/)).toBeInTheDocument()
        expect(screen.getByText('Enter the 6-digit code sent to person@example.com.')).toBeInTheDocument()
    })

    it('verifies the entered code for the requested email', async () => {
        const user = userEvent.setup()
        render(
            <MemoryRouter>
                <Routes>
                    <Route path="*" element={<LoginPage />} />
                </Routes>
            </MemoryRouter>,
        )

        await user.type(screen.getByLabelText(/Email/), 'person@example.com')
        await user.click(screen.getByRole('button', { name: 'Send code' }))
        await user.type(await screen.findByLabelText(/Verification code/), '123456')
        await user.click(screen.getByRole('button', { name: 'Verify and sign in' }))

        expect(verifyCode).toHaveBeenCalledWith({ email: 'person@example.com', code: '123456' })
    })
})
