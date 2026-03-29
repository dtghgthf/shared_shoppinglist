"use client";

import { Item } from "@/lib/types";

interface Props {
  item: Item;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDelete: () => void;
}

export default function ShoppingItem({
  item,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDelete,
}: Props) {
  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    await fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, checked: !item.checked }),
    });
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    // Optimistic: remove from parent state immediately
    onDelete();
    await fetch("/api/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
  }

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="flex items-center gap-3 px-3 py-2.5 rounded-[4px] transition-colors duration-150 select-none"
      style={{
        backgroundColor: isDragging ? "var(--item-drag)" : "transparent",
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
    >
      {/* Drag handle */}
      <span
        className="flex-shrink-0 transition-opacity duration-150"
        style={{ color: "var(--border-strong)", opacity: 0.3, cursor: "grab" }}
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="4" cy="4" r="1.5"/>
          <circle cx="8" cy="4" r="1.5"/>
          <circle cx="4" cy="8" r="1.5"/>
          <circle cx="8" cy="8" r="1.5"/>
          <circle cx="4" cy="12" r="1.5"/>
          <circle cx="8" cy="12" r="1.5"/>
        </svg>
      </span>

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className="w-5 h-5 flex-shrink-0 rounded-[4px] border-2 flex items-center justify-center transition-colors duration-150"
        style={{
          borderColor: item.checked ? "var(--accent)" : "var(--border-subtle)",
          backgroundColor: item.checked ? "var(--accent)" : "transparent",
          cursor: "pointer",
        }}
        aria-label={item.checked ? "Als nicht erledigt markieren" : "Als erledigt markieren"}
      >
        {item.checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Text */}
      <span
        className="flex-1 text-sm transition-colors duration-150"
        style={{
          color: item.checked ? "var(--border-strong)" : "var(--text-primary)",
          textDecoration: item.checked ? "line-through" : "none",
        }}
      >
        {item.text}
      </span>

      {/* Delete — always visible at low opacity, full on hover */}
      <button
        onClick={handleDelete}
        aria-label="Artikel löschen"
        className="flex-shrink-0 p-1 rounded-[4px] transition-opacity duration-150"
        style={{ color: "var(--border-strong)", opacity: 0.35, cursor: "pointer" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.35")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </li>
  );
}
