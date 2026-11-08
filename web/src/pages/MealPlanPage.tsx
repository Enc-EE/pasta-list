import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import GroupIcon from '@mui/icons-material/Group'
import TodayIcon from '@mui/icons-material/Today'
import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAppDispatch } from '../app/hooks'
import EditMealDialog from '../components/mealPlan/EditMealDialog'
import MealDayCard from '../components/mealPlan/MealDayCard'
import MealPlanMembersDialog from '../components/mealPlan/MealPlanMembersDialog'
import {
    buildMealPlanDays,
    groupEntriesByDate,
    mealPlanRange,
} from '../components/mealPlan/mealPlanDates'
import {
    useCreateMealPlanEntryMutation,
    useCreateMealPlanMutation,
    useDeleteMealPlanEntryMutation,
    useDeleteMealPlanMutation,
    useGetMealPlanQuery,
    useMoveMealPlanEntryMutation,
    useUpdateMealPlanEntryMutation,
} from '../features/api/pastaListApi'
import { snackbarShown } from '../features/ui/uiSlice'
import type { MealPlanEntry, MealPlanSlot } from '../types/mealPlan'

function isNotFound(error: unknown): boolean {
    return typeof error === 'object'
        && error !== null
        && 'status' in error
        && error.status === 404
}

function parseDropTarget(id: string): { date: string; slot: MealPlanSlot } | null {
    const [date, slot] = id.split('|')
    if (!date || (slot !== 'Lunch' && slot !== 'Dinner')) {
        return null
    }

    return { date, slot }
}

export default function MealPlanPage() {
    const dispatch = useAppDispatch()
    const today = useMemo(() => new Date(), [])
    const range = useMemo(() => mealPlanRange(today), [today])
    const days = useMemo(() => buildMealPlanDays(today), [today])
    const todayIndex = useMemo(() => days.findIndex((day) => day.isToday), [days])

    const { data: plan, isLoading, isError, error } = useGetMealPlanQuery(range)
    const [createMealPlan, { isLoading: isCreating }] = useCreateMealPlanMutation()
    const [deleteMealPlan] = useDeleteMealPlanMutation()
    const [createEntry] = useCreateMealPlanEntryMutation()
    const [updateEntry] = useUpdateMealPlanEntryMutation()
    const [moveEntry] = useMoveMealPlanEntryMutation()
    const [deleteEntry] = useDeleteMealPlanEntryMutation()

    const [membersOpen, setMembersOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState<MealPlanEntry | null>(null)
    const [activeEntry, setActiveEntry] = useState<MealPlanEntry | null>(null)

    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const didInitialScroll = useRef(false)

    const virtualizer = useVirtualizer({
        count: days.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => 180,
        overscan: 6,
        getItemKey: (index) => days[index].date,
    })

    const entriesByDate = useMemo(
        () => groupEntriesByDate(plan?.entries ?? []),
        [plan?.entries],
    )

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    useEffect(() => {
        if (!plan || didInitialScroll.current || todayIndex < 0) {
            return
        }

        virtualizer.scrollToIndex(todayIndex, { align: 'start' })
        didInitialScroll.current = true
    }, [plan, todayIndex, virtualizer])

    const create = async () => {
        try {
            await createMealPlan().unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not create the meal plan.', severity: 'error' }))
        }
    }

    const removePlan = async () => {
        if (!window.confirm('Delete your meal plan? This cannot be undone.')) {
            return
        }

        try {
            await deleteMealPlan().unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not delete the meal plan.', severity: 'error' }))
        }
    }

    const addEntry = async (date: string, slot: MealPlanSlot, name: string): Promise<boolean> => {
        try {
            await createEntry({ date, slot, name }).unwrap()
            return true
        } catch {
            dispatch(snackbarShown({ message: 'Could not add the meal.', severity: 'error' }))
            return false
        }
    }

    const removeEntry = async (entry: MealPlanEntry) => {
        try {
            await deleteEntry(entry.id).unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not delete the meal.', severity: 'error' }))
        }
    }

    const saveEntryName = async (entry: MealPlanEntry, name: string): Promise<boolean> => {
        try {
            await updateEntry({ entryId: entry.id, body: { name } }).unwrap()
            return true
        } catch {
            dispatch(snackbarShown({ message: 'Could not rename the meal.', severity: 'error' }))
            return false
        }
    }

    const moveEntryTo = async (entry: MealPlanEntry, date: string, slot: MealPlanSlot) => {
        if (entry.date === date && entry.slot === slot) {
            return
        }

        try {
            await moveEntry({
                entryId: entry.id,
                body: { date, slot },
                range,
            }).unwrap()
        } catch {
            dispatch(snackbarShown({ message: 'Could not move the meal.', severity: 'error' }))
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        const entry = plan?.entries.find((item) => item.id === String(event.active.id))
        setActiveEntry(entry ?? null)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveEntry(null)

        const entry = plan?.entries.find((item) => item.id === String(event.active.id))
        if (!entry || !event.over) {
            return
        }

        const target = parseDropTarget(String(event.over.id))
        if (target) {
            void moveEntryTo(entry, target.date, target.slot)
        }
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (isError && isNotFound(error)) {
        return (
            <Stack spacing={3}>
                <Typography variant="h1">Meal plan</Typography>
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h2" gutterBottom>
                        Plan your lunches and dinners
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Create a meal plan and share it with the people you cook for.
                    </Typography>
                    <Button variant="contained" onClick={create} disabled={isCreating}>
                        Create meal plan
                    </Button>
                </Paper>
            </Stack>
        )
    }

    if (isError || !plan) {
        return <Alert severity="error">This meal plan could not be loaded.</Alert>
    }

    const canEdit = plan.role !== 'Viewer'

    return (
        <Stack spacing={3}>
            <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
            >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="h1">Meal plan</Typography>
                    <Chip
                        size="small"
                        label={plan.role}
                        color={plan.role === 'Owner' ? 'primary' : 'default'}
                    />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Button
                        startIcon={<TodayIcon />}
                        onClick={() => virtualizer.scrollToIndex(todayIndex, { align: 'start' })}
                    >
                        Today
                    </Button>
                    <Button startIcon={<GroupIcon />} onClick={() => setMembersOpen(true)}>
                        Members
                    </Button>
                    {plan.role === 'Owner' && (
                        <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={removePlan}>
                            Delete
                        </Button>
                    )}
                </Stack>
            </Stack>

            {!canEdit && <Alert severity="info">You have view-only access to this meal plan.</Alert>}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveEntry(null)}
            >
                <Box
                    ref={scrollContainerRef}
                    sx={{
                        height: 'calc(100dvh - 300px)',
                        minHeight: 320,
                        overflowY: 'auto',
                        pr: { xs: 0, sm: 1 },
                    }}
                >
                    <Box sx={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const day = days[virtualRow.index]
                            if (!day) {
                                return null
                            }

                            return (
                                <Box
                                    key={virtualRow.key}
                                    ref={virtualizer.measureElement}
                                    data-index={virtualRow.index}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        pb: 2,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <MealDayCard
                                        day={day}
                                        entries={entriesByDate.get(day.date) ?? []}
                                        canEdit={canEdit}
                                        onAdd={addEntry}
                                        onDelete={removeEntry}
                                        onEdit={setEditingEntry}
                                    />
                                </Box>
                            )
                        })}
                    </Box>
                </Box>

                <DragOverlay dropAnimation={null}>
                    {activeEntry ? <Chip label={activeEntry.name} color="primary" /> : null}
                </DragOverlay>
            </DndContext>

            <MealPlanMembersDialog
                open={membersOpen}
                onClose={() => setMembersOpen(false)}
                currentUserRole={plan.role}
            />

            <EditMealDialog
                entry={editingEntry}
                onClose={() => setEditingEntry(null)}
                onSave={saveEntryName}
            />
        </Stack>
    )
}
