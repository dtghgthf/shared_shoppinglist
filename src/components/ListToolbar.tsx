"use client";

import { useState } from "react";
import Link from "next/link";
import ShareModal from "./ShareModal";

interface Props {
  listId: string;
  listName: string;
  listUrl: string;
}

export default function ListToolbar({ listId, listName, listUrl }: Props) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteChecked() {
    if (!confirm("Alle erledigten Artikel löschen?")) return;

    setIsDeleting(true);
    try {
      await fetch("/api/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_id: listId, deleteChecked: true }),
      });
    } catch (err) {
      console.error("Failed to delete checked items:", err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "var(--border-strong)" }}
        >
          ← Zurück
        </Link>

        <div className="flex items-center gap-2">
          {/* Delete Checked Button */}
          <button
            onClick={handleDeleteChecked}
            disabled={isDeleting}
            className="text-xs px-3 py-1.5 rounded-[4px] border transition-all duration-150 flex items-center gap-1.5"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
              opacity: isDeleting ? 0.5 : 1,
            }}
            title="Erledigte Artikel löschen"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <span className="hidden sm:inline">Erledigte löschen</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="text-xs px-3 py-1.5 rounded-[4px] transition-all duration-150 flex items-center gap-1.5 font-medium"
            style={{
              backgroundColor: "var(--accent)",
              color: "white",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>Teilen</span>
          </button>
        </div>
      </div>

      <ShareModal
        url={listUrl}
        listName={listName}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
