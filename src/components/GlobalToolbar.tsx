"use client";

import { useEffect, useState } from "react";
import ShareModal from "./ShareModal";
import UploadModal from "./UploadModal";

interface ListData {
  listId: string;
  listName: string;
  listUrl: string;
}

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
}

export default function GlobalToolbar() {
  const [dark, setDark] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [listData, setListData] = useState<ListData | null>(null);

  useEffect(() => {
    // Sync initial state from what the inline script already applied
    setDark(document.documentElement.classList.contains("dark"));

    // Sync changes made in other tabs
    function onStorage(e: StorageEvent) {
      if (e.key === "theme" && e.newValue) {
        const isDark = e.newValue === "dark";
        setDark(isDark);
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    // Poll for list data changes (set by ListPageWrapper)
    const checkListData = () => {
      const data = (window as any).__listToolbarData;
      setListData(data);
    };
    
    checkListData();
    const interval = setInterval(checkListData, 100);
    return () => clearInterval(interval);
  }, []);

  function toggleTheme() {
    setDark((prev) => {
      applyTheme(!prev);
      return !prev;
    });
  }

  async function handleDeleteChecked() {
    if (!listData) return;
    if (!confirm("Alle erledigten Artikel löschen?")) return;

    setIsDeleting(true);
    try {
      await fetch("/api/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_id: listData.listId, deleteChecked: true }),
      });
    } catch (err) {
      console.error("Failed to delete checked items:", err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Upload Button - only on list pages */}
        {listData && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            aria-label="Datei hochladen"
            title="Datei hochladen"
            className="w-8 h-8 flex items-center justify-center rounded-[4px] transition-colors duration-150"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
        )}

        {/* Delete Checked Button - only on list pages */}
        {listData && (
          <button
            onClick={handleDeleteChecked}
            disabled={isDeleting}
            aria-label="Erledigte Artikel löschen"
            title="Erledigte löschen"
            className="w-8 h-8 flex items-center justify-center rounded-[4px] transition-colors duration-150"
            style={{
              color: "var(--text-secondary)",
              opacity: isDeleting ? 0.5 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        )}

        {/* Share Button - only on list pages */}
        {listData && (
          <button
            onClick={() => setIsShareModalOpen(true)}
            aria-label="Liste teilen"
            title="Liste teilen"
            className="w-8 h-8 flex items-center justify-center rounded-[4px] transition-colors duration-150"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        )}

        {/* Theme Toggle - always visible */}
        <button
          onClick={toggleTheme}
          aria-label={dark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
          title={dark ? "Hellmodus" : "Dunkelmodus"}
          suppressHydrationWarning
          className="w-8 h-8 flex items-center justify-center rounded-[4px] transition-colors duration-150"
          style={{ color: "var(--text-secondary)" }}
        >
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Upload Modal */}
      {listData && (
        <UploadModal
          listId={listData.listId}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}

      {/* Share Modal */}
      {listData && (
        <ShareModal
          url={listData.listUrl}
          listName={listData.listName}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </>
  );
}
