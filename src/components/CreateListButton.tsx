"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateListButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.id) {
        const history: { id: string; name: string; isOwner: boolean }[] = JSON.parse(localStorage.getItem("shopping_list_history") || "[]");
        history.push({ id: data.id, name: data.name, isOwner: true });
        localStorage.setItem("shopping_list_history", JSON.stringify(history));
        router.push(`/list/${data.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="
        px-8 py-3 text-white font-medium rounded-[4px]
        transition-transform duration-200 hover:scale-105 active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
      "
      style={{ backgroundColor: "var(--accent)" }}
    >
      {loading ? "Wird erstellt…" : "Neue Liste erstellen"}
    </button>
  );
}
