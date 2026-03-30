"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

interface HistoryItem {
  id: string;
  name: string;
  isOwner: boolean;
  exists?: boolean;
}

export default function ListHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [validatedHistory, setValidatedHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("shopping_list_history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Validate that lists still exist in the database
  useEffect(() => {
    const validateLists = async () => {
      const results = await Promise.all(
        history.map(async (item) => {
          try {
            const res = await fetch(`/api/lists?id=${item.id}`);
            return { ...item, exists: res.ok };
          } catch {
            return { ...item, exists: false };
          }
        })
      );
      const validLists = results.filter((item) => item.exists);
      setValidatedHistory(validLists);
      localStorage.setItem("shopping_list_history", JSON.stringify(validLists));
    };

    if (history.length > 0) {
      validateLists();
    }
  }, [history]);

  const removeList = async (id: string) => {
    try {
      await fetch(`/api/lists?id=${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete list:", e);
    }

    const newHistory = validatedHistory.filter((item) => item.id !== id);
    setValidatedHistory(newHistory);
    localStorage.setItem("shopping_list_history", JSON.stringify(newHistory));
  };

  if (validatedHistory.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
        Letzte Listen
      </h2>
      <div className="flex flex-col gap-2">
        {validatedHistory.map((list) => (
          <div
            key={list.id}
            className="flex items-center justify-between p-3 rounded-[4px] border"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
          >
            <div className="flex flex-col">
              <Link href={`/list/${list.id}`} className="font-medium hover:underline" style={{ color: "var(--text-primary)" }}>
                {list.name}
              </Link>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--border-strong)" }}>
                {list.isOwner ? "Besitzer" : "Gast"}
              </span>
            </div>
            {list.isOwner && (
              <button
                onClick={() => removeList(list.id)}
                className="p-1 hover:bg-red-50 rounded"
                title="Liste löschen"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
