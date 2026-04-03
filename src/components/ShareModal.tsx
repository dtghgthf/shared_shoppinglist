"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Settings } from "lucide-react";
import ListAccessSettings from "./ListAccessSettings";
import ClaimListButton from "./ClaimListButton";

interface Props {
  url: string;
  listId: string;
  listName: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
  isOwner?: boolean;
  isUnclaimed?: boolean;
}

type Tab = "share" | "settings";

export default function ShareModal({
  url,
  listId,
  listName,
  isOpen,
  onClose,
  currentUserId = null,
  isOwner = false,
  isUnclaimed = false,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const [activeTab, setActiveTab] = useState<Tab>(() => isOwner ? "settings" : "share");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Handle body overflow when modal opens/closes
  // Reset tab to correct value when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(isOwner ? "settings" : "share");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isOwner]);

  // Generate QR code when URL or dark mode changes
  useEffect(() => {
    const dark = isDark ? "#f0efe8" : "#141413";
    const light = isDark ? "#1a1918" : "#f5f4ed";
    QRCode.toDataURL(url, {
      width: 240,
      margin: 2,
      color: { dark, light },
    }).then(setDataUrl);
  }, [url, isDark]);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSystemShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listName,
          text: `Sieh dir meine Einkaufsliste "${listName}" an!`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error - silently ignore
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }
  }

  if (!isOpen) return null;

  const showTabs = currentUserId && (isOwner || !isUnclaimed);

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
        className="fixed z-50 left-0 right-0 bottom-0 md:left-1/2 md:right-auto md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md rounded-t-[12px] md:rounded-[12px] shadow-2xl transition-transform duration-200 max-h-[90vh] flex flex-col"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <h3 className="text-lg font-semibold heading" style={{ color: "var(--text-primary)" }}>
            Liste teilen
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

        {/* Tabs */}
        {showTabs && (
          <div
            className="flex border-b flex-shrink-0"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <button
              onClick={() => setActiveTab("share")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
              style={{
                color: activeTab === "share" ? "var(--accent)" : "var(--text-secondary)",
                borderBottom: activeTab === "share" ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <QrCode size={16} />
              QR-Code
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
              style={{
                color: activeTab === "settings" ? "var(--accent)" : "var(--text-secondary)",
                borderBottom: activeTab === "settings" ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <Settings size={16} />
              Einstellungen
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "share" && (
            <div className="flex flex-col items-center gap-4 p-6">
              <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                QR-Code scannen oder Link teilen
              </p>

              {/* QR Code */}
              {dataUrl ? (
                <div
                  className="p-4 rounded-[8px]"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <img src={dataUrl} alt="QR-Code" width={240} height={240} />
                </div>
              ) : (
                <div
                  className="w-[240px] h-[240px] flex items-center justify-center rounded-[8px]"
                  style={{ backgroundColor: "var(--border-subtle)" }}
                >
                  <span className="text-sm" style={{ color: "var(--border-strong)" }}>Wird generiert…</span>
                </div>
              )}

              {/* URL */}
              <p className="text-xs break-all text-center px-3 py-2 rounded-[4px] max-w-full" style={{ color: "var(--border-strong)", backgroundColor: "var(--bg)" }}>
                {url}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button
                  onClick={handleCopy}
                  className="flex-1 text-sm px-4 py-2.5 rounded-[4px] border transition-all duration-150 font-medium"
                  style={{
                    borderColor: copied ? "var(--accent)" : "var(--border-subtle)",
                    color: copied ? "var(--accent)" : "var(--text-primary)",
                    backgroundColor: "var(--bg)",
                  }}
                >
                  {copied ? "✓ Kopiert!" : "Link kopieren"}
                </button>

                {canShare && (
                  <button
                    onClick={handleSystemShare}
                    className="flex-1 text-sm px-4 py-2.5 rounded-[4px] transition-all duration-150 font-medium"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "white",
                    }}
                  >
                    Teilen
                  </button>
                )}
              </div>

              {/* Claim button for unclaimed lists */}
              {isUnclaimed && currentUserId && (
                <div className="w-full mt-2">
                  <ClaimListButton listId={listId} />
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-6">
              <ListAccessSettings
                listId={listId}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
