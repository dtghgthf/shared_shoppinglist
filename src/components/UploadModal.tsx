"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ listId, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Reset state when closed
      setError(null);
      setSuccess(null);
      setLoading(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleFile(file: File) {
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
      const message = data.message || "";
      
      if (count > 0 || message.includes("aktualisiert") || message.includes("zusammengeführt")) {
        setSuccess(`✓ ${message || `${count} Artikel hinzugefügt`}`);
        setTimeout(() => {
          onClose();
        }, 2000);
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/', 'text/', 'application/pdf'];
    const isValid = validTypes.some(type => file.type.startsWith(type));
    
    if (!isValid) {
      setError("Ungültiger Dateityp. Bitte Bild, Text oder PDF hochladen.");
      return;
    }
    
    await handleFile(file);
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        onClick={onClose}
      />

      {/* Modal - Bottom sheet on mobile, center on desktop */}
      <div
        className="fixed z-50 left-0 right-0 bottom-0 md:left-1/2 md:right-auto md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg rounded-t-[12px] md:rounded-[12px] shadow-2xl transition-transform duration-200"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <h3 className="text-lg font-semibold heading" style={{ color: "var(--text-primary)" }}>
            Datei hochladen
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-[4px] transition-opacity hover:opacity-70"
            style={{ color: "var(--border-strong)" }}
            aria-label="Schließen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 p-6">
          <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
            KI analysiert deine Datei und extrahiert automatisch Einkaufsartikel
          </p>

          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative border-2 border-dashed rounded-[8px] p-8 transition-all duration-200 cursor-pointer"
            style={{
              borderColor: isDragging ? "var(--accent)" : "var(--border-subtle)",
              backgroundColor: isDragging ? "var(--item-drag)" : "var(--bg)",
            }}
            onClick={() => !loading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,text/*,.pdf"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: "none" }}
            />

            <div className="flex flex-col items-center gap-3">
              {loading ? (
                <>
                  <div className="animate-spin" style={{ color: "var(--accent)" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="2" x2="12" y2="6"/>
                      <line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                      <line x1="2" y1="12" x2="6" y2="12"/>
                      <line x1="18" y1="12" x2="22" y2="12"/>
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                    KI analysiert…
                  </p>
                </>
              ) : success ? (
                <>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <p className="text-sm font-medium text-center" style={{ color: "var(--accent)" }}>
                    {success}
                  </p>
                </>
              ) : (
                <>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--border-strong)" }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                      Datei hier ablegen
                    </p>
                    <p className="text-xs" style={{ color: "var(--border-strong)" }}>
                      oder klicken zum Auswählen
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--border-strong)" }}>
                    Bilder, Text oder PDF • Max 10 MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="text-sm p-3 rounded-[4px] text-center"
              style={{
                backgroundColor: "rgba(217, 119, 87, 0.1)",
                color: "var(--accent)",
              }}
            >
              ✗ {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
