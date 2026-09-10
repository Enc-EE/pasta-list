import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import { useState, type FormEvent } from 'react'

import { useAppDispatch } from '../../app/hooks'
import {
    useGetMembersQuery,
    useInviteMemberMutation,
    useRemoveMemberMutation,
    useUpdateMemberRoleMutation,
} from '../../features/api/pastaListApi'
import { snackbarShown } from '../../features/ui/uiSlice'
import type { ShoppingListRole } from '../../types/shoppingList'

interface ListMembersDialogProps {
    open: boolean
    onClose: () => void
    listId: string
    currentUserRole: ShoppingListRole
}

const INVITABLE_ROLES: ShoppingListRole[] = ['Viewer', 'Editor', 'Owner']

export default function ListMembersDialog({ open, onClose, listId, currentUserRole }: ListMembersDialogProps) {
    const dispatch = useAppDispatch()
    const isOwner = currentUserRole === 'Owner'
    const { data: members, isLoading } = useGetMembersQuery(listId, { skip: !open })
    const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation()
    const [updateMemberRole] = useUpdateMemberRoleMutation()
    const [removeMember] = useRemoveMemberMutation()

    const [email, setEmail] = useState('')
    const [role, setRole] = useState<ShoppingListRole>('Editor')

    const invite = async (event: FormEvent) => {
        event.preventDefault()
        if (!email.trim()) {
            return
        }

        try {
            const result = await inviteMember({ listId, body: { email: email.trim(), role } }).unwrap()
            dispatch(snackbarShown({
                message: result ? 'Member added.' : 'Invitation sent. They will gain access once they sign in.',
                severity: 'success',
            }))
            setEmail('')
        } catch {
            dispatch(snackbarShown({ message: 'Could not invite this person.', severity: 'error' }))
        }
    }

    const changeRole = async (userId: string, newRole: ShoppingListRole) => {
        try {
            await updateMemberRole({ listId, userId, body: { role: newRole } }).unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not change the role.', severity: 'error' }))
        }
    }

    const remove = async (userId: string) => {
        try {
            await removeMember({ listId, userId }).unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not remove this member.', severity: 'error' }))
        }
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Manage members</DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List disablePadding>
                        {members?.map((member) => (
                            <ListItem
                                key={member.id}
                                disablePadding
                                sx={{ py: 1 }}
                                secondaryAction={
                                    isOwner ? (
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <TextField
                                                select
                                                size="small"
                                                value={member.role}
                                                onChange={(event) => changeRole(member.userId, event.target.value as ShoppingListRole)}
                                                sx={{ width: 110 }}
                                            >
                                                {INVITABLE_ROLES.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                            <IconButton
                                                edge="end"
                                                aria-label={`Remove ${member.email}`}
                                                onClick={() => remove(member.userId)}
                                            >
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </Stack>
                                    ) : undefined
                                }
                            >
                                <ListItemText primary={member.email} secondary={isOwner ? undefined : member.role} />
                            </ListItem>
                        ))}
                    </List>
                )}

                {isOwner && (
                    <Stack component="form" onSubmit={invite} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                        <TextField
                            label="Invite by email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            select
                            label="Role"
                            value={role}
                            onChange={(event) => setRole(event.target.value as ShoppingListRole)}
                            sx={{ width: { sm: 130 } }}
                            size="small"
                        >
                            {INVITABLE_ROLES.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Button type="submit" variant="contained" disabled={isInviting || !email.trim()}>
                            Invite
                        </Button>
                    </Stack>
                )}

                {!isOwner && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Only the owner can invite people or change roles.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}
