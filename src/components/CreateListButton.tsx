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
        body: JSON.stringify({ name: "Einkaufsliste" }),
      });
      const data = await res.json();
      if (data.id) router.push(`/list/${data.id}`);
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
