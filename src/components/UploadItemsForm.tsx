"use client";

import { useRef, useState } from "react";

interface Props {
  listId: string;
}

export default function UploadItemsForm({ listId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("list_id", listId);

      const response = await fetch("/api/upload-items", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload fehlgeschlagen");
      }

      const count = data.items?.length ?? 0;
      if (count > 0) {
        setSuccess(`${count} Artikel hinzugefügt`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Keine Artikel in der Datei gefunden");
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="
            px-3 py-2.5 text-sm font-medium rounded-[4px]
            transition-transform duration-200 hover:scale-105 active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
            flex items-center gap-2
          "
          style={{
            backgroundColor: "var(--accent)",
            color: "white",
          }}
          title="Datei hochladen: Bild, Text, PDF"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {loading ? "KI analysiert…" : "Datei hochladen"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,text/*,.pdf"
          onChange={handleFileChange}
          disabled={loading}
          style={{ display: "none" }}
        />

        {success && (
          <p className="text-xs px-1" style={{ color: "var(--accent)" }}>
            ✓ {success}
          </p>
        )}
        {error && (
          <p className="text-xs px-1" style={{ color: "#d97757" }}>
            ✗ {error}
          </p>
        )}
      </div>
    </div>
  );
}
