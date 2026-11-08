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
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
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
                p: 1,
                bgcolor: isOver ? 'action.hover' : 'transparent',
                outline: isOver ? '1px dashed' : 'none',
                outlineColor: 'primary.main',
            }}
        >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
                    {slot}
                </Typography>
                {canEdit && !isAdding && (
                    <Button size="small" startIcon={<AddIcon />} onClick={() => setIsAdding(true)}>
                        Add
                    </Button>
                )}
            </Stack>

            {entries.length === 0 && !isAdding && (
                <Typography variant="body2" color="text.secondary">
                    No meals planned yet.
                </Typography>
            )}

            {entries.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, pt: 0.5 }}>
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
                    spacing={1}
                    sx={{ alignItems: 'center', mt: 1 }}
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
                    <Button type="submit" variant="contained" disabled={isSaving || !name.trim()}>
                        Add
                    </Button>
                    <IconButton aria-label={`Stop adding ${slot.toLowerCase()} meals`} onClick={cancel}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
            )}
        </Box>
    )
}

export default function MealDayCard({ day, entries, canEdit, onAdd, onDelete, onEdit }: MealDayCardProps) {
    return (
        <Paper
            component="section"
            variant="outlined"
            aria-label={`${day.weekday}, ${day.dateLabel}`}
            sx={{ p: 2 }}
        >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap', gap: 0.5 }}>
                <Typography variant="h2">{day.weekday}</Typography>
                <Typography variant="body1" color="text.secondary">
                    {day.dateLabel}
                </Typography>
                {day.isToday && <Chip size="small" label="Today" color="primary" />}
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1.5}>
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
        </Paper>
    )
}
