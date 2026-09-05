import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useParams } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../app/hooks'
import { useGetListQuery } from '../features/api/pastaListApi'
import { hideCheckedItemsToggled } from '../features/ui/uiSlice'
import AddItemForm from '../components/items/AddItemForm'
import ShoppingItemList from '../components/items/ShoppingItemList'

export default function ListDetailPage() {
    const { listId = '' } = useParams<{ listId: string }>()
    const dispatch = useAppDispatch()
    const hideCheckedItems = useAppSelector((state) => state.ui.hideCheckedItems)
    const { data: list, isLoading, isError } = useGetListQuery(listId, { skip: !listId })

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

    return (
        <Stack spacing={3}>
            <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start' }}>
                All lists
            </Button>

            <Box>
                <Typography variant="h1">{list.name}</Typography>
                {list.description && (
                    <Typography variant="body1" color="text.secondary">
                        {list.description}
                    </Typography>
                )}
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
                <AddItemForm listId={list.id} />
            </Paper>

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

            <ShoppingItemList listId={list.id} items={visibleItems} />
        </Stack>
    )
}
