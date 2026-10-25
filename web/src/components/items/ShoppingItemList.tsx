import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { useAppDispatch } from "../../app/hooks";
import { useToggleItemMutation } from "../../features/api/pastaListApi";
import type { ShoppingListItem } from "../../types/shoppingList";
import EditItemForm from "./EditItemForm";

interface ShoppingItemListProps {
  listId: string;
  items: ShoppingListItem[];
  readOnly?: boolean;
}

export default function ShoppingItemList({
  listId,
  items,
  readOnly = false,
}: ShoppingItemListProps) {
  const dispatch = useAppDispatch();
  const [toggleItem] = useToggleItemMutation();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <Typography color="text.secondary">
        Nothing to buy here. Add an item below.
      </Typography>
    );
  }

  return (
    <List>
      {items.map((item) =>
        !readOnly && item.id === editingItemId ? (
          <ListItem key={item.id} disablePadding>
            <EditItemForm
              listId={listId}
              item={item}
              onDone={() => setEditingItemId(null)}
            />
          </ListItem>
        ) : (
          <ListItem
            key={item.id}
            sx={{
              boxShadow: 2,
              marginBottom: 0.5,
              backgroundColor: (theme) =>
                item.isChecked ? theme.palette.success.light : undefined,
            }}
            // dense
            disablePadding
            secondaryAction={
              readOnly ? undefined : (
                <Stack direction="row">
                  <IconButton
                    sx={{
                      boxShadow: 2,
                    }}
                    aria-label={`Check ${item.name}`}
                    onClick={() =>
                      !readOnly && toggleItem({ listId, itemId: item.id })
                    }
                  >
                    <CheckOutlinedIcon />
                  </IconButton>
                </Stack>
              )
            }
          >
            <ListItemButton
              onClick={() => setEditingItemId(item.id)}
              disabled={readOnly}
              // dense
              sx={{ pr: readOnly ? undefined : 12 }}
            >
              {/* <ListItemIcon>
                                <Checkbox edge="start" checked={item.isChecked} tabIndex={-1} disableRipple />
                            </ListItemIcon> */}
              <ListItemText
                primary={
                  item.quantity === 1
                    ? item.name
                    : `${item.quantity} x ${item.name}`
                }
                // secondary={[item.quantity, item.unit].filter(Boolean).join(' ')}
              />
            </ListItemButton>
          </ListItem>
        ),
      )}
    </List>
  );
}

// TODO: support drag & drop reordering using SortOrder.
