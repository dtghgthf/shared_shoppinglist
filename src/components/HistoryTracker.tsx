"use client";

import { useEffect } from "react";

interface HistoryTrackerProps {
  listId: string;
  listName: string;
}

export default function HistoryTracker({ listId, listName }: HistoryTrackerProps) {
  useEffect(() => {
    const rawHistory = localStorage.getItem("shopping_list_history");
    const history: { id: string; name: string; isOwner?: boolean }[] = rawHistory ? JSON.parse(rawHistory) : [];

    const exists = history.find((h) => h.id === listId);
    if (!exists) {
      history.push({ id: listId, name: listName, isOwner: false });
      localStorage.setItem("shopping_list_history", JSON.stringify(history));
    }
  }, [listId, listName]);

  return null;
}
