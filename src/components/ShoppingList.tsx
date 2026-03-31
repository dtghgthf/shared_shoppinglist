"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { DndContext, DragEndEvent, DragOverEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { supabase } from "@/lib/supabase/client";
import { Item } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import ShoppingItem from "./ShoppingItem";

interface Props {
  listId: string;
  initialItems: Item[];
}

export interface ShoppingListHandle {
  addOptimisticItem: (item: Item) => void;
  replaceTemp: (tempId: string, realItem: Item) => void;
}

interface DropPosition {
  targetId: string;
  position: "before" | "after";
}

const ShoppingList = forwardRef<ShoppingListHandle, Props>(function ShoppingList(
  { listId, initialItems },
  ref
) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Expose imperative handle for parent
  useImperativeHandle(ref, () => ({
    addOptimisticItem: (item: Item) => {
      setItems((prev) => {
        const maxOrder = Math.max(...prev.map((i) => i.order_index), 0);
        return [...prev, { ...item, order_index: maxOrder + 1000 }];
      });
    },
    replaceTemp: (tempId: string, realItem: Item) => {
      setItems((prev) => {
        const realAlreadyPresent = prev.some((i) => i.id === realItem.id);
        if (realAlreadyPresent) {
          return prev.filter((i) => i.id !== tempId);
        }
        return prev.map((i) => (i.id === tempId ? realItem : i));
      });
    },
  }));

  useEffect(() => {
    const channel = supabase
      .channel(`items:${listId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `list_id=eq.${listId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => {
              if (prev.some((i) => i.id === (payload.new as Item).id)) return prev;
              return [...prev, payload.new as Item];
            });
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((item) =>
                item.id === (payload.new as Item).id ? (payload.new as Item) : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Record<string, unknown>;
            const deletedId = oldRow.id as string;
            if (deletedId) {
              setItems((prev) => prev.filter((item) => item.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId]);

  // Optimistic toggle handler
  function handleToggle(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const newChecked = !item.checked;
    
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, checked: newChecked } : i))
    );

    fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, checked: newChecked }),
    });
  }

  // Optimistic edit handler
  function handleEdit(itemId: string, newText: string) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, text: newText } : i))
    );

    fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, text: newText }),
    });
  }

  function handleDelete(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setDropPosition(null);
      return;
    }

    const overId = over.id as string;
    const overElement = document.querySelector(`[data-item-id="${overId}"]`);
    if (!overElement) return;

    const rect = overElement.getBoundingClientRect();
    const mouseY = event.activatorEvent instanceof MouseEvent 
      ? event.activatorEvent.clientY 
      : (event.activatorEvent as PointerEvent).clientY;
    
    const midpoint = rect.top + rect.height / 2;
    const position = mouseY < midpoint ? "before" : "after";

    setDropPosition({ targetId: overId, position });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggingId(null);
    setDropPosition(null);

    if (!over || active.id === over.id) return;

    const sourceId = active.id as string;
    const targetId = over.id as string;

    const sourceItem = items.find((i) => i.id === sourceId);
    const targetItem = items.find((i) => i.id === targetId);
    if (!sourceItem || !targetItem) return;

    const catItems = [...items]
      .filter((i) => i.category === targetItem.category)
      .sort((a, b) => a.order_index - b.order_index);

    const targetIdx = catItems.findIndex((i) => i.id === targetId);
    const position = dropPosition?.position || "after";

    let newOrder: number;
    if (position === "before") {
      const prev = catItems[targetIdx - 1];
      if (!prev) {
        newOrder = targetItem.order_index - 500;
      } else {
        newOrder = (prev.order_index + targetItem.order_index) / 2;
      }
    } else {
      const next = catItems[targetIdx + 1];
      if (!next) {
        newOrder = targetItem.order_index + 500;
      } else {
        newOrder = (targetItem.order_index + next.order_index) / 2;
      }
    }

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === sourceId
          ? { ...i, order_index: newOrder, category: targetItem.category }
          : i
      )
    );

    fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sourceId,
        order_index: newOrder,
        category: targetItem.category,
      }),
    });
  }

  // Group items by category, preserving CATEGORIES order
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: items
      .filter((i) => i.category === cat.id)
      .sort((a, b) => a.order_index - b.order_index),
  })).filter((g) => g.items.length > 0);

  if (items.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: "var(--border-strong)" }}>
        Noch keine Artikel. Füge oben etwas hinzu.
      </p>
    );
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDraggingId(e.active.id as string)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-1">
        {/* Progress */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs" style={{ color: "var(--border-strong)" }}>
            {checkedCount} von {items.length} erledigt
          </span>
          {checkedCount > 0 && (
            <div
              className="h-1 flex-1 mx-4 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--border-subtle)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(checkedCount / items.length) * 100}%`,
                  backgroundColor: "var(--accent)",
                }}
              />
            </div>
          )}
        </div>

        {grouped.map(({ category, items: catItems }) => (
          <div key={category.id} className="mb-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded-[4px]"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            >
              <span className="text-base">{category.icon}</span>
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--border-strong)" }}
              >
                {category.label}
              </span>
              <span className="text-xs ml-auto" style={{ color: "var(--border-strong)" }}>
                {catItems.filter((i) => i.checked).length}/{catItems.length}
              </span>
            </div>
            <ul>
              {catItems.map((item) => {
                const showIndicatorBefore =
                  dropPosition?.targetId === item.id && dropPosition?.position === "before";
                const showIndicatorAfter =
                  dropPosition?.targetId === item.id && dropPosition?.position === "after";

                return (
                  <div key={item.id}>
                    {showIndicatorBefore && (
                      <div
                        className="h-0.5 my-1 rounded-full"
                        style={{ backgroundColor: "var(--accent)" }}
                      />
                    )}
                    <ShoppingItem
                      item={item}
                      isDragging={draggingId === item.id}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={() => handleDelete(item.id)}
                    />
                    {showIndicatorAfter && (
                      <div
                        className="h-0.5 my-1 rounded-full"
                        style={{ backgroundColor: "var(--accent)" }}
                      />
                    )}
                  </div>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </DndContext>
  );
});

export default ShoppingList;
