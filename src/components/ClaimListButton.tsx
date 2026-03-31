"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { claimList } from "@/lib/list/actions";

interface Props {
  listId: string;
  onClaimed?: () => void;
}

export default function ClaimListButton({ listId, onClaimed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleClaim() {
    setLoading(true);
    setError(null);

    const result = await claimList(listId);

    if (!result.success) {
      setError(result.error || "Fehler beim Übernehmen");
      setLoading(false);
      setShowConfirm(false);
    } else {
      onClaimed?.();
      window.location.reload();
    }
  }

  if (showConfirm) {
    return (
      <div
        className="flex flex-col gap-3 p-4 rounded-[8px]"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      >
        <div className="flex items-start gap-3">
          <Shield
            size={20}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "var(--accent)" }}
          />
          <div className="flex flex-col gap-1">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Liste übernehmen?
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Du wirst der Besitzer dieser Liste. Du kannst dann die Sichtbarkeit
              ändern und Mitglieder verwalten.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="text-xs px-3 py-2 rounded-[4px]"
            style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="flex-1 text-sm px-3 py-2 rounded-[4px] border transition-opacity hover:opacity-70"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleClaim}
            disabled={loading}
            className="flex-1 text-sm px-3 py-2 rounded-[4px] font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--accent)",
              color: "white",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Wird übernommen…" : "Übernehmen"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 w-full text-sm px-4 py-3 rounded-[4px] font-medium transition-all duration-150 hover:opacity-90"
      style={{
        backgroundColor: "var(--accent)",
        color: "white",
      }}
    >
      <Shield size={16} />
      <span>Diese Liste übernehmen</span>
    </button>
  );
}
