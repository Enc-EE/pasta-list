import AddIcon from '@mui/icons-material/Add'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useGetListsQuery } from '../features/api/pastaListApi'
import CreateListDialog from '../components/lists/CreateListDialog'

export default function ListsPage() {
    const navigate = useNavigate()
    const [dialogOpen, setDialogOpen] = useState(false)
    const { data: lists, isLoading, isError } = useGetListsQuery()

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (isError) {
        return <Alert severity="error">Could not load your shopping lists. Is the API running?</Alert>
    }

    return (
        <Stack spacing={3}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h1">Your lists</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                    New list
                </Button>
            </Stack>

            {lists?.length === 0 && (
                <Alert severity="info">No lists yet. Create your first one to get started.</Alert>
            )}

            <Stack spacing={2}>
                {lists?.map((list) => {
                    const progress = list.itemCount === 0 ? 0 : (list.checkedItemCount / list.itemCount) * 100

                    return (
                        <Card key={list.id} variant="outlined">
                            <CardActionArea onClick={() => navigate(`/lists/${list.id}`)}>
                                <CardContent>
                                    <Typography variant="h2">{list.name}</Typography>
                                    {list.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {list.description}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                        {list.checkedItemCount} of {list.itemCount} done
                                    </Typography>
                                    <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    )
                })}
            </Stack>

            <CreateListDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
        </Stack>
    )
}
