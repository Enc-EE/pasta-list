import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ShoppingListItem } from "../../types/shoppingList";
import ShoppingItemList from "./ShoppingItemList";

const updateItem = vi.fn();
const updateItemPosition = vi.fn();
const toggleItem = vi.fn();
const mutationState = { isReordering: false, isToggling: false };

vi.mock("../../app/hooks", () => ({
  useAppDispatch: () => vi.fn(),
}));

vi.mock("../../features/api/pastaListApi", () => ({
  useToggleItemMutation: () => [
    toggleItem,
    { isLoading: mutationState.isToggling },
  ],
  useDeleteItemMutation: () => [vi.fn()],
  useUpdateItemMutation: () => [updateItem, { isLoading: false }],
  useUpdateItemPositionMutation: () => [
    updateItemPosition,
    { isLoading: mutationState.isReordering },
  ],
}));

const item: ShoppingListItem = {
  id: "item-1",
  shoppingListId: "list-1",
  name: "Penne",
  quantity: 2,
  unit: "kg",
  category: null,
  note: "whole wheat",
  isChecked: false,
  sortOrder: 0,
};

describe("ShoppingItemList", () => {
  afterEach(() => {
    cleanup();
    updateItem.mockReset();
    updateItemPosition.mockReset();
    toggleItem.mockReset();
    mutationState.isReordering = false;
    mutationState.isToggling = false;
  });

  it.each([
    { quantity: 1, label: "Penne" },
    { quantity: 2, label: "2 Penne" },
  ])('shows quantity $quantity inline as "$label"', ({ quantity, label }) => {
    render(
      <ShoppingItemList listId="list-1" items={[{ ...item, quantity }]} />,
    );

    expect(screen.getByText(label)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: label }),
    ).not.toBeInTheDocument();
  });

  it("edits an item inline and keeps fields the form does not show", async () => {
    updateItem.mockReturnValue({ unwrap: () => Promise.resolve() });
    const user = userEvent.setup();
    render(<ShoppingItemList listId="list-1" items={[item]} />);

    await user.click(screen.getByRole("button", { name: "Edit Penne" }));

    const nameField = screen.getByRole("textbox", { name: "Item" });
    expect(nameField).toHaveFocus();
    await user.clear(nameField);
    await user.type(nameField, "Fusilli");
    await user.click(screen.getByRole("button", { name: "Quantity 4" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateItem).toHaveBeenCalledWith({
      listId: "list-1",
      itemId: "item-1",
      body: {
        name: "Fusilli",
        quantity: 4,
        unit: "kg",
        category: null,
        note: "whole wheat",
        isChecked: false,
      },
    });
    expect(
      await screen.findByRole("button", { name: "Edit Penne" }),
    ).toBeInTheDocument();
  });

  it("closes the edit form when switching to shopping mode", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ShoppingItemList listId="list-1" items={[item]} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit Penne" }));
    expect(screen.getByRole("textbox", { name: "Item" })).toBeInTheDocument();

    rerender(
      <ShoppingItemList listId="list-1" items={[item]} mode="shopping" />,
    );

    expect(
      screen.queryByRole("textbox", { name: "Item" }),
    ).not.toBeInTheDocument();
  });

  it("hides edit controls for read-only lists", () => {
    render(<ShoppingItemList listId="list-1" items={[item]} readOnly />);

    expect(
      screen.queryByRole("button", { name: "Edit Penne" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reorder Penne" }),
    ).not.toBeInTheDocument();
  });

  it("shows only checking controls in shopping mode", () => {
    render(
      <ShoppingItemList listId="list-1" items={[item]} mode="shopping" />,
    );

    expect(
      screen.getByRole("button", { name: "Check Penne" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Penne" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reorder Penne" }),
    ).not.toBeInTheDocument();
  });

  it("hides checking controls in edit mode", () => {
    render(<ShoppingItemList listId="list-1" items={[item]} />);

    expect(
      screen.queryByRole("button", { name: "Check Penne" }),
    ).not.toBeInTheDocument();
  });

  it("shows a named reorder handle for each editable item", () => {
    const milk: ShoppingListItem = {
      ...item,
      id: "item-2",
      name: "Milk",
      quantity: 1,
      sortOrder: 1000,
    };
    render(<ShoppingItemList listId="list-1" items={[item, milk]} />);

    expect(
      screen.getByRole("button", { name: "Reorder Penne" }),
    ).toHaveAttribute("aria-roledescription", "sortable");
    expect(
      screen.getByRole("button", { name: "Reorder Milk" }),
    ).toHaveAttribute("aria-roledescription", "sortable");
  });

  it("reorders an item with its keyboard drag handle", async () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const row = this.closest("li");
        const rows = Array.from(document.querySelectorAll("li"));
        const index = row ? Math.max(0, rows.indexOf(row)) : 0;
        const top = index * 50;
        return {
          x: 0,
          y: top,
          top,
          left: 0,
          bottom: top + 50,
          right: 100,
          width: 100,
          height: 50,
          toJSON: () => ({}),
        };
      });

    try {
      updateItemPosition.mockReturnValue({ unwrap: () => Promise.resolve() });
      const user = userEvent.setup();
      const milk: ShoppingListItem = {
        ...item,
        id: "item-2",
        name: "Milk",
        quantity: 1,
        sortOrder: 1000,
      };
      const tomatoes: ShoppingListItem = {
        ...item,
        id: "item-3",
        name: "Tomatoes",
        quantity: 1,
        sortOrder: 2000,
      };
      render(
        <ShoppingItemList listId="list-1" items={[item, milk, tomatoes]} />,
      );

      screen.getByRole("button", { name: "Reorder Penne" }).focus();
      await user.keyboard(" ");
      await user.keyboard("{ArrowDown}");
      await user.keyboard(" ");

      await waitFor(() =>
        expect(updateItemPosition).toHaveBeenCalledWith({
          listId: "list-1",
          itemId: "item-1",
          body: { previousItemId: "item-2", nextItemId: "item-3" },
          orderedItemIds: ["item-2", "item-1", "item-3"],
        }),
      );
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("checks an item through the shared mutation hook", async () => {
    toggleItem.mockReturnValue({ unwrap: () => Promise.resolve() });
    const user = userEvent.setup();
    render(
      <ShoppingItemList listId="list-1" items={[item]} mode="shopping" />,
    );

    await user.click(screen.getByRole("button", { name: "Check Penne" }));

    expect(toggleItem).toHaveBeenCalledWith({
      listId: "list-1",
      itemId: "item-1",
    });
  });

  it("disables item actions while reordering is pending", () => {
    mutationState.isReordering = true;
    render(<ShoppingItemList listId="list-1" items={[item]} />);

    expect(screen.getByRole("button", { name: "Reorder Penne" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit Penne" })).toBeDisabled();
  });

  it("disables checking while reordering is pending", () => {
    mutationState.isReordering = true;
    render(
      <ShoppingItemList listId="list-1" items={[item]} mode="shopping" />,
    );

    expect(screen.getByRole("button", { name: "Check Penne" })).toBeDisabled();
  });

  it("prevents dragging while a checked-state update is pending", () => {
    mutationState.isToggling = true;
    render(<ShoppingItemList listId="list-1" items={[item]} />);

    expect(screen.getByRole("button", { name: "Reorder Penne" })).toBeDisabled();
  });
});
