"use client";

import { useRef, useState } from "react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const editInputRef = useRef<HTMLInputElement>(null);

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setEditText(item.text);
    setIsEditing(true);
    setTimeout(() => editInputRef.current?.select(), 0);
  }

  async function handleEditSave() {
    const trimmed = editText.trim();
    setIsEditing(false);
    if (!trimmed || trimmed === item.text) return;
    await fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, text: trimmed }),
    });
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(item.text);
    }
  }

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
      draggable={!isEditing}
      onDragStart={isEditing ? undefined : onDragStart}
      onDragOver={isEditing ? undefined : onDragOver}
      onDrop={isEditing ? undefined : onDrop}
      onDragEnd={isEditing ? undefined : onDragEnd}
      className="flex items-center gap-3 px-3 py-2.5 rounded-[4px] transition-colors duration-150 select-none"
      style={{
        backgroundColor: isDragging ? "var(--item-drag)" : "transparent",
        opacity: isDragging ? 0.5 : 1,
        cursor: isEditing ? "default" : "grab",
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

      {/* Text / Edit */}
      {isEditing ? (
        <input
          ref={editInputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={handleEditKeyDown}
          className="flex-1 text-sm bg-transparent border-b outline-none"
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--accent)",
          }}
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className="flex-1 text-sm transition-colors duration-150 cursor-text"
          style={{
            color: item.checked ? "var(--border-strong)" : "var(--text-primary)",
            textDecoration: item.checked ? "line-through" : "none",
          }}
        >
          {item.text}
        </span>
      )}

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
