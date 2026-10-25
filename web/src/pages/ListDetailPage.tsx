import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import GroupIcon from '@mui/icons-material/Group'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'

import { useAppDispatch } from '../app/hooks'
import { 
    useDeleteCheckedItemsMutation, 
    useDeleteListMutation, 
    useGetListQuery 
} from '../features/api/pastaListApi'
import { snackbarShown } from '../features/ui/uiSlice'
import AddItemForm from '../components/items/AddItemForm'
import ShoppingItemList from '../components/items/ShoppingItemList'
import ListMembersDialog from '../components/lists/ListMembersDialog'

export default function ListDetailPage() {
    const { listId = '' } = useParams<{ listId: string }>()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { data: list, isLoading, isError } = useGetListQuery(listId, { skip: !listId })
    const [deleteList] = useDeleteListMutation()
    const [deleteCheckedItems] = useDeleteCheckedItemsMutation()
    const [membersDialogOpen, setMembersDialogOpen] = useState(false)
    const [isAddingItems, setIsAddingItems] = useState(false)
    const addFormRef = useRef<HTMLDivElement>(null)
    const itemCount = list?.items.length

    // The list refetches after an add, so the form moves down only once new data arrives.
    useEffect(() => {
        if (isAddingItems) {
            addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [isAddingItems, itemCount])

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

    const visibleItems = list.items
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

    const removeCheckedItems = async () => {
        const checkedCount = list.items.filter((i) => i.isChecked).length
        if (checkedCount === 0) {
            return
        }

        if (!window.confirm(`Delete ${checkedCount} checked items? This cannot be undone.`)) {
            return
        }

        try {
            await deleteCheckedItems(list.id).unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not delete checked items.', severity: 'error' }))
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

            {!canEdit && <Alert severity="info">You have view-only access to this list.</Alert>}

            <Divider />

            <ShoppingItemList listId={list.id} items={visibleItems} readOnly={!canEdit} />
 
            {canEdit && (
                <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', zIndex: 10 }}>
                    <Stack sx={{ direction: 'row', justifyContent: 'center' }}>
                        {isAddingItems ? (
                            <Paper ref={addFormRef} variant="outlined" sx={{ p: 2, scrollMarginBottom: 16, width: '100%', maxWidth: 600 }}>
                                <AddItemForm listId={list.id} onClose={() => setIsAddingItems(false)} />
                            </Paper>
                         ) : (
                             <Stack direction="row" spacing={1}>
                                 <Button
                                     variant="contained"
                                     startIcon={<AddIcon />}
                                     onClick={() => setIsAddingItems(true)}
                                 >
                                     Add item
                                 </Button>
                                 <Button
                                     variant="outlined"
                                     color="error"
                                     startIcon={<DeleteSweepIcon />}
                                     onClick={removeCheckedItems}
                                 >
                                     Clear checked
                                 </Button>
                             </Stack>
                         )}

                    </Stack>
                </Box>
            )}
 
            <Box sx={{ height: 80 }} />
 
            <ListMembersDialog
                open={membersDialogOpen}
                onClose={() => setMembersDialogOpen(false)}
                listId={list.id}
                currentUserRole={list.role}
            />
        </Stack>
    )
}
