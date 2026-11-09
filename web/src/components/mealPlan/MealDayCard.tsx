import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import CloseIcon from '@mui/icons-material/Close'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import type { MealPlanEntry, MealPlanSlot } from '../../types/mealPlan'
import { entriesForSlot, type MealPlanDay } from './mealPlanDates'

export interface MealDayCardProps {
    day: MealPlanDay
    entries: MealPlanEntry[]
    canEdit: boolean
    onAdd: (date: string, slot: MealPlanSlot, name: string) => Promise<boolean>
    onDelete: (entry: MealPlanEntry) => void
    onEdit: (entry: MealPlanEntry) => void
}

interface MealChipProps {
    entry: MealPlanEntry
    canEdit: boolean
    onDelete: (entry: MealPlanEntry) => void
    onEdit: (entry: MealPlanEntry) => void
}

function MealChip({ entry, canEdit, onDelete, onEdit }: MealChipProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: entry.id,
        disabled: !canEdit,
    })

    return (
        <Chip
            ref={setNodeRef}
            label={entry.name}
            onClick={canEdit ? () => onEdit(entry) : undefined}
            onDelete={canEdit
                ? (event) => {
                    event.stopPropagation()
                    onDelete(entry)
                }
                : undefined}
            deleteIcon={canEdit
                ? <CancelIcon onPointerDown={(event) => event.stopPropagation()} />
                : undefined}
            {...(canEdit ? attributes : {})}
            {...(canEdit ? listeners : {})}
            sx={{
                cursor: canEdit ? 'grab' : 'default',
                opacity: isDragging ? 0.4 : 1,
                transform: CSS.Translate.toString(transform),
                touchAction: canEdit ? 'none' : undefined,
                maxWidth: '100%',
                fontWeight: 500,
                '& .MuiChip-label': { px: 1.25 },
            }}
        />
    )
}

interface MealSlotSectionProps {
    date: string
    slot: MealPlanSlot
    entries: MealPlanEntry[]
    canEdit: boolean
    onAdd: (date: string, slot: MealPlanSlot, name: string) => Promise<boolean>
    onDelete: (entry: MealPlanEntry) => void
    onEdit: (entry: MealPlanEntry) => void
}

function MealSlotSection({ date, slot, entries, canEdit, onAdd, onDelete, onEdit }: MealSlotSectionProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `${date}|${slot}`,
        disabled: !canEdit,
    })
    const nameInputRef = useRef<HTMLInputElement>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [name, setName] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const submit = async (event: FormEvent) => {
        event.preventDefault()

        const trimmedName = name.trim()
        if (!trimmedName || isSaving) {
            return
        }

        setIsSaving(true)
        const added = await onAdd(date, slot, trimmedName)
        setIsSaving(false)

        if (added) {
            setName('')
            nameInputRef.current?.focus()
        }
    }

    const cancel = () => {
        setIsAdding(false)
        setName('')
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            cancel()
        }
    }

    return (
        <Box
            ref={setNodeRef}
            aria-label={`${slot} meals`}
            sx={{
                borderRadius: 1,
                p: 0.5,
                bgcolor: isOver ? 'action.hover' : 'transparent',
                outline: isOver ? '1px dashed' : 'none',
                outlineColor: 'primary.main',
            }}
        >
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {slot}
                </Typography>
                {canEdit && !isAdding && (
                    <Button size="small" startIcon={<AddIcon />} onClick={() => setIsAdding(true)}>
                        Add
                    </Button>
                )}
            </Stack>

            {entries.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, pt: 0.25 }}>
                    {entries.map((entry) => (
                        <MealChip
                            key={entry.id}
                            entry={entry}
                            canEdit={canEdit}
                            onDelete={onDelete}
                            onEdit={onEdit}
                        />
                    ))}
                </Stack>
            )}

            {isAdding && (
                <Stack
                    component="form"
                    onSubmit={submit}
                    onKeyDown={handleKeyDown}
                    aria-label={`Add ${slot.toLowerCase()} meal`}
                    direction="row"
                    spacing={0.5}
                    sx={{ alignItems: 'center', mt: 0.5 }}
                >
                    <TextField
                        label={`${slot} meal`}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        inputRef={nameInputRef}
                        size="small"
                        autoFocus
                        fullWidth
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        disabled={isSaving || !name.trim()}
                    >
                        Add
                    </Button>
                    <IconButton
                        size="small"
                        aria-label={`Stop adding ${slot.toLowerCase()} meals`}
                        onClick={cancel}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )}
        </Box>
    )
}

export default function MealDayCard({ day, entries, canEdit, onAdd, onDelete, onEdit }: MealDayCardProps) {
    return (
        <Box
            component="section"
            aria-label={`${day.weekday}, ${day.dateLabel}`}
            sx={{
                px: { xs: 1.5, sm: 2 },
                py: 1,
                bgcolor: 'background.paper',
                backgroundImage: day.isToday
                    ? (theme) => `linear-gradient(${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.08)})`
                    : 'none',
                boxShadow: day.isToday
                    ? (theme) => `inset 3px 0 0 ${theme.palette.primary.main}`
                    : 'none',
            }}
        >
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    mx: { xs: -1.5, sm: -2 },
                    px: { xs: 1.5, sm: 2 },
                    pt: 0.5,
                    pb: 0.5,
                    bgcolor: 'background.paper',
                    backgroundImage: day.isToday
                        ? (theme) => `linear-gradient(${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.08)})`
                        : 'none',
                    boxShadow: day.isToday
                        ? (theme) => `inset 3px 0 0 ${theme.palette.primary.main}`
                        : 'none',
                }}
            >
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline', flexWrap: 'wrap', gap: 0.5 }}>
                    <Typography
                        variant="subtitle1"
                        component="h2"
                        sx={{ fontWeight: day.isToday ? 700 : 600 }}
                    >
                        {day.weekday}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {day.dateLabel}
                    </Typography>
                    {day.isToday && (
                        <Chip
                            size="small"
                            label="Today"
                            color="primary"
                            sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }}
                        />
                    )}
                </Stack>

                <Divider sx={{ mt: 0.5 }} />
            </Box>

            <Stack spacing={0.5}>
                <MealSlotSection
                    date={day.date}
                    slot="Lunch"
                    entries={entriesForSlot(entries, 'Lunch')}
                    canEdit={canEdit}
                    onAdd={onAdd}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
                <MealSlotSection
                    date={day.date}
                    slot="Dinner"
                    entries={entriesForSlot(entries, 'Dinner')}
                    canEdit={canEdit}
                    onAdd={onAdd}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            </Stack>
        </Box>
    )
}
