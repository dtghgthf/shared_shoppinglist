"use client";

import { useState } from "react";
import Link from "next/link";

interface List {
  id: string;
  name: string;
  created_at: string;
  item_count: number;
}

interface Props {
  initialLists: List[];
}

export default function AdminListsClient({ initialLists }: Props) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  async function handleDelete(id: string, name: string) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/lists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Löschen fehlgeschlagen");
      }

      // Optimistic update
      setLists((prev) => prev.filter((list) => list.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      alert(`Fehler: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  if (lists.length === 0) {
    return (
      <div
        className="p-6 rounded-[4px] text-center"
        style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}
      >
        Keine Listen vorhanden
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[4px]" style={{ backgroundColor: "var(--bg-elevated)" }}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ backgroundColor: "var(--item-hover)" }}>
            <th className="text-left p-4 font-semibold" style={{ color: "var(--text-primary)" }}>
              Name
            </th>
            <th className="text-left p-4 font-semibold" style={{ color: "var(--text-primary)" }}>
              Erstellt am
            </th>
            <th className="text-center p-4 font-semibold" style={{ color: "var(--text-primary)" }}>
              Artikel
            </th>
            <th className="text-center p-4 font-semibold" style={{ color: "var(--text-primary)" }}>
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody>
          {lists.map((list) => (
            <tr
              key={list.id}
              style={{
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <td className="p-4" style={{ color: "var(--text-primary)" }}>
                <span className="font-medium">{list.name}</span>
                <br />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  ID: {list.id.slice(0, 8)}…
                </span>
              </td>
              <td className="p-4" style={{ color: "var(--text-secondary)" }}>
                {formatDate(list.created_at)}
              </td>
              <td className="p-4 text-center" style={{ color: "var(--text-secondary)" }}>
                {list.item_count}
              </td>
              <td className="p-4">
                <div className="flex gap-2 justify-center">
                  <Link
                    href={`/list/${list.id}`}
                    target="_blank"
                    className="px-3 py-1.5 text-xs rounded-[4px] transition-transform hover:scale-105"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "white",
                    }}
                  >
                    Öffnen
                  </Link>

                  {deleteConfirm === list.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(list.id, list.name)}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs rounded-[4px] font-medium transition-opacity disabled:opacity-60"
                        style={{ backgroundColor: "#d97757", color: "white" }}
                      >
                        Bestätigen
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs rounded-[4px] transition-opacity disabled:opacity-60"
                        style={{
                          backgroundColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(list.id)}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs rounded-[4px] transition-opacity hover:opacity-80 disabled:opacity-60"
                      style={{
                        backgroundColor: "transparent",
                        color: "var(--border-strong)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
