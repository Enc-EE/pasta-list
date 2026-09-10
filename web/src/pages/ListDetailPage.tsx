import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import GroupIcon from '@mui/icons-material/Group'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../app/hooks'
import { useDeleteListMutation, useGetListQuery } from '../features/api/pastaListApi'
import { hideCheckedItemsToggled, snackbarShown } from '../features/ui/uiSlice'
import AddItemForm from '../components/items/AddItemForm'
import ShoppingItemList from '../components/items/ShoppingItemList'
import ListMembersDialog from '../components/lists/ListMembersDialog'

export default function ListDetailPage() {
    const { listId = '' } = useParams<{ listId: string }>()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const hideCheckedItems = useAppSelector((state) => state.ui.hideCheckedItems)
    const { data: list, isLoading, isError } = useGetListQuery(listId, { skip: !listId })
    const [deleteList] = useDeleteListMutation()
    const [membersDialogOpen, setMembersDialogOpen] = useState(false)

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (isError || !list) {
        return <Alert severity="error">This list could not be loaded.</Alert>
    }

    const visibleItems = hideCheckedItems ? list.items.filter((item) => !item.isChecked) : list.items
    const canEdit = list.role !== 'Viewer'
    const isOwner = list.role === 'Owner'

    const removeList = async () => {
        if (!window.confirm(`Delete "${list.name}"? This cannot be undone.`)) {
            return
        }

        try {
            await deleteList(list.id).unwrap()
            navigate('/', { replace: true })
        } catch {
            dispatch(snackbarShown({ message: 'Could not delete the list.', severity: 'error' }))
        }
    }

    return (
        <Stack spacing={3}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
                    All lists
                </Button>
                <Stack direction="row" spacing={1}>
                    <Button startIcon={<GroupIcon />} onClick={() => setMembersDialogOpen(true)}>
                        Members
                    </Button>
                    {isOwner && (
                        <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={removeList}>
                            Delete
                        </Button>
                    )}
                </Stack>
            </Stack>

            <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="h1">{list.name}</Typography>
                    <Chip size="small" label={list.role} color={isOwner ? 'primary' : 'default'} />
                </Stack>
                {list.description && (
                    <Typography variant="body1" color="text.secondary">
                        {list.description}
                    </Typography>
                )}
            </Box>

            {canEdit ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <AddItemForm listId={list.id} />
                </Paper>
            ) : (
                <Alert severity="info">You have view-only access to this list.</Alert>
            )}

            <Divider />

            <FormControlLabel
                control={
                    <Switch
                        checked={hideCheckedItems}
                        onChange={() => dispatch(hideCheckedItemsToggled())}
                    />
                }
                label="Hide checked items"
            />

            <ShoppingItemList listId={list.id} items={visibleItems} readOnly={!canEdit} />

            <ListMembersDialog
                open={membersDialogOpen}
                onClose={() => setMembersDialogOpen(false)}
                listId={list.id}
                currentUserRole={list.role}
            />
        </Stack>
    )
}
