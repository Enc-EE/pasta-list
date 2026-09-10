import RestaurantIcon from '@mui/icons-material/Restaurant'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useRequestLoginCodeMutation, useVerifyLoginCodeMutation } from '../features/api/pastaListApi'

const RESEND_COOLDOWN_SECONDS = 60

interface LocationState {
    from?: { pathname: string }
}

export default function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [step, setStep] = useState<'email' | 'code'>('email')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [cooldown, setCooldown] = useState(0)

    const [requestLoginCode, { isLoading: isSendingCode, error: requestError }] = useRequestLoginCodeMutation()
    const [verifyLoginCode, { isLoading: isVerifying, error: verifyError }] = useVerifyLoginCodeMutation()

    useEffect(() => {
        if (cooldown <= 0) {
            return
        }

        const timer = setInterval(() => setCooldown((value) => value - 1), 1000)
        return () => clearInterval(timer)
    }, [cooldown])

    const sendCode = async (event?: FormEvent) => {
        event?.preventDefault()
        if (!email.trim() || cooldown > 0) {
            return
        }

        try {
            await requestLoginCode({ email: email.trim() }).unwrap()
        } catch {
            // The request-code endpoint never reveals whether it failed for enumeration reasons;
            // the error alert below is the only feedback needed.
        }

        setStep('code')
        setCooldown(RESEND_COOLDOWN_SECONDS)
    }

    const verifyCode = async (event: FormEvent) => {
        event.preventDefault()
        if (code.length !== 6) {
            return
        }

        try {
            await verifyLoginCode({ email: email.trim(), code }).unwrap()
            const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/'
            navigate(redirectTo, { replace: true })
        } catch {
            // The error alert below already reflects the failure.
        }
    }

    return (
        <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Paper variant="outlined" sx={{ p: 4, maxWidth: 400, width: '100%' }}>
                <Stack spacing={3} sx={{ alignItems: 'center' }}>
                    <RestaurantIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h1" sx={{ fontSize: '1.5rem' }}>
                        Sign in to Pasta List
                    </Typography>

                    {step === 'email' ? (
                        <Stack component="form" onSubmit={sendCode} spacing={2} sx={{ width: '100%' }}>
                            <Typography variant="body2" color="text.secondary">
                                Enter your email and we will send you a one-time verification code.
                            </Typography>
                            <TextField
                                label="Email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                fullWidth
                                autoFocus
                            />
                            {requestError && <Alert severity="error">Could not send the code. Please try again.</Alert>}
                            <Button type="submit" variant="contained" disabled={isSendingCode || !email.trim()}>
                                Send code
                            </Button>
                        </Stack>
                    ) : (
                        <Stack component="form" onSubmit={verifyCode} spacing={2} sx={{ width: '100%' }}>
                            <Typography variant="body2" color="text.secondary">
                                Enter the 6-digit code sent to {email}.
                            </Typography>
                            <TextField
                                label="Verification code"
                                value={code}
                                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                slotProps={{
                                    htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6 },
                                }}
                                required
                                fullWidth
                                autoFocus
                            />
                            {verifyError && <Alert severity="error">That code is invalid or expired.</Alert>}
                            <Button type="submit" variant="contained" disabled={isVerifying || code.length !== 6}>
                                Verify and sign in
                            </Button>
                            <Button variant="text" disabled={cooldown > 0 || isSendingCode} onClick={() => sendCode()}>
                                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                            </Button>
                            <Button
                                variant="text"
                                onClick={() => {
                                    setStep('email')
                                    setCode('')
                                }}
                            >
                                Use a different email
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Paper>
        </Box>
    )
}
