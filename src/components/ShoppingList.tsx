"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Item } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import ShoppingItem from "./ShoppingItem";

interface Props {
  listId: string;
  initialItems: Item[];
}

export default function ShoppingList({ listId, initialItems }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const dragItemId = useRef<string | null>(null);
  const dragOverItemId = useRef<string | null>(null);

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
            // Need REPLICA IDENTITY FULL to get the full row in payload.old.
            // Run: ALTER TABLE items REPLICA IDENTITY FULL;
            const oldRow = payload.old as Record<string, unknown>;
            const deletedId = oldRow.id as string;
            if (deletedId) {
              setItems((prev) => prev.filter((item) => item.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listId]);

  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, itemId: string) {
    dragItemId.current = itemId;
    setDraggingId(itemId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, itemId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverItemId.current = itemId;
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const sourceId = dragItemId.current;
    if (!sourceId || sourceId === targetId) return;

    const sourceItem = items.find((i) => i.id === sourceId);
    const targetItem = items.find((i) => i.id === targetId);
    if (!sourceItem || !targetItem) return;

    // Items in the same category, sorted by order_index
    const catItems = [...items]
      .filter((i) => i.category === targetItem.category)
      .sort((a, b) => a.order_index - b.order_index);

    const targetIdx = catItems.findIndex((i) => i.id === targetId);
    const prev = catItems[targetIdx - 1];
    const next = catItems[targetIdx + 1];

    let newOrder: number;
    if (!prev) {
      newOrder = targetItem.order_index - 500;
    } else if (!next) {
      newOrder = targetItem.order_index + 500;
    } else {
      newOrder = (prev.order_index + targetItem.order_index) / 2;
    }

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === sourceId
          ? { ...i, order_index: newOrder, category: targetItem.category }
          : i
      )
    );

    await fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sourceId,
        order_index: newOrder,
        category: targetItem.category,
      }),
    });
  }

  function handleDragEnd() {
    dragItemId.current = null;
    dragOverItemId.current = null;
    setDraggingId(null);
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
    <div className="flex flex-col gap-1">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: "var(--border-strong)" }}>
          {checkedCount} von {items.length} erledigt
        </span>
        {checkedCount > 0 && (
          <div className="h-1 flex-1 mx-4 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(checkedCount / items.length) * 100}%`, backgroundColor: "var(--accent)" }}
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
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--border-strong)" }}>
              {category.label}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--border-strong)" }}>
              {catItems.filter((i) => i.checked).length}/{catItems.length}
            </span>
          </div>
          <ul>
            {catItems.map((item) => (
              <ShoppingItem
                key={item.id}
                item={item}
                isDragging={draggingId === item.id}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={(e) => handleDrop(e, item.id)}
                onDragEnd={handleDragEnd}
                onDelete={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
