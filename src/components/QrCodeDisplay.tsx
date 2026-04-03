"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  url: string;
}

export default function QrCodeDisplay({ url }: Props) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const dark = isDark ? "#f0efe8" : "#141413";
    const light = isDark ? "#1a1918" : "#f5f4ed";
    QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark, light },
    }).then(setDataUrl);
  }, [url, isDark]);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="flex flex-col items-center gap-3 p-5 rounded-[4px] border"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-elevated)" }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        QR-Code scannen zum Beitreten
      </p>

      {dataUrl ? (
        <img src={dataUrl} alt="QR-Code" width={200} height={200} />
      ) : (
        <div
          className="w-[200px] h-[200px] flex items-center justify-center rounded-[4px]"
          style={{ backgroundColor: "var(--border-subtle)" }}
        >
          <span className="text-sm" style={{ color: "var(--border-strong)" }}>Wird generiert…</span>
        </div>
      )}

      <p className="text-xs break-all text-center max-w-[200px]" style={{ color: "var(--border-strong)" }}>
        {url}
      </p>

      <button
        onClick={handleCopy}
        className="text-xs px-3 py-1.5 rounded-[4px] border transition-colors duration-150"
        style={{
          borderColor: "var(--border-subtle)",
          color: copied ? "var(--accent)" : "var(--text-secondary)",
        }}
      >
        {copied ? "Kopiert!" : "Link kopieren"}
      </button>
    </div>
  );
}
