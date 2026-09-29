import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

const quickQuantities = ['1', '2', '3', '4', '5']

export interface QuantityInputProps {
    value: string
    onChange: (value: string) => void
}

export default function QuantityInput({ value, onChange }: QuantityInputProps) {
    return (
        <Stack direction="row" spacing={1}>
            <TextField
                label="Qty"
                type="number"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                sx={{ width: { xs: 72, sm: 100 }, flexShrink: 0 }}
                size="small"
            />
            <ToggleButtonGroup
                exclusive
                aria-label="Quick quantity"
                value={quickQuantities.includes(value) ? value : null}
                onChange={(_, selected: string | null) => selected && onChange(selected)}
                size="small"
                sx={{ flex: { xs: 1, sm: 'none' } }}
            >
                {quickQuantities.map((quantity) => (
                    <ToggleButton
                        key={quantity}
                        value={quantity}
                        aria-label={`Quantity ${quantity}`}
                        sx={{ flex: 1, minWidth: 44 }}
                    >
                        {quantity}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Stack>
    )
}
