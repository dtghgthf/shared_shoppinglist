"use client";

import { useState } from "react";

export default function EditableListName({ listId, initialName }: { listId: string, initialName: string }) {
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);

  const saveName = async () => {
    await fetch("/api/lists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: listId, name }),
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-4xl font-normal p-1 border rounded"
        />
        <button className="text-sm" onClick={saveName}>Speichern</button>
      </div>
    );
  }

  return (
    <h1
      className="heading text-4xl font-normal cursor-pointer"
      style={{ color: "var(--text-primary)" }}
      onClick={() => setIsEditing(true)}
    >
      {name}
    </h1>
  );
}
