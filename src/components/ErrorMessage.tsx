"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface ErrorMessageProps {
  message: string;
  dismissable?: boolean;
  onDismiss?: () => void;
}

export default function ErrorMessage({
  message,
  dismissable = true,
  onDismiss,
}: ErrorMessageProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className="p-3 rounded-[4px] text-sm flex items-start justify-between gap-3"
      style={{
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        color: "#dc2626",
        border: "1px solid rgba(220, 38, 38, 0.3)",
      }}
      role="alert"
      aria-live="polite"
    >
      <span className="flex-1">{message}</span>
      {dismissable && (
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex p-0.5 hover:opacity-70 transition-opacity"
          aria-label="Fehler schließen"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
