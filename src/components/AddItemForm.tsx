"use client";

import { useRef, useState } from "react";
import { detectCategory, getCategoryById } from "@/lib/categories";
import { Item } from "@/lib/types";

interface Props {
  listId: string;
  onItemAdding?: (item: Item) => void;
  onItemAdded?: (tempId: string, realItem: Item) => void;
}

export default function AddItemForm({ listId, onItemAdding, onItemAdded }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectedCategory = text.trim() ? getCategoryById(detectCategory(text)) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const category = detectCategory(text);
    const trimmedText = text.trim();
    
    // Generate temp UUID
    const tempId = `temp-${crypto.randomUUID()}`;
    
    // Create optimistic item
    const optimisticItem: Item = {
      id: tempId,
      list_id: listId,
      text: trimmedText,
      checked: false,
      category,
      order_index: 0, // Will be calculated by ShoppingList
      created_at: new Date().toISOString(),
    };

    // Immediately notify parent to add to UI
    onItemAdding?.(optimisticItem);
    
    setText("");
    inputRef.current?.focus();
    setLoading(true);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_id: listId, text: trimmedText, category }),
      });
      
      if (res.ok) {
        const realItem = await res.json();
        onItemAdded?.(tempId, realItem);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Artikel hinzufügen…"
          disabled={loading}
          className="
            flex-1 px-4 py-2.5 rounded-[4px] border bg-transparent text-sm
            outline-none transition-colors duration-150
            disabled:opacity-60
          "
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="
            px-5 py-2.5 text-white text-sm font-medium rounded-[4px]
            transition-transform duration-200 hover:scale-105 active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
          "
          style={{ backgroundColor: "var(--accent)" }}
        >
          Hinzufügen
        </button>
      </form>
      {detectedCategory && (
        <p className="text-xs px-1" style={{ color: "var(--border-strong)" }}>
          {detectedCategory.icon} Wird einsortiert unter:{" "}
          <span style={{ color: "var(--text-secondary)" }}>{detectedCategory.label}</span>
        </p>
      )}
    </div>
  );
}
