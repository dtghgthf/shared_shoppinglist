"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function QrCodeScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);
  const isRunningRef = useRef(false);
  const router = useRouter();

  async function stopScanner() {
    if (scannerRef.current && isRunningRef.current) {
      isRunningRef.current = false;
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // already stopped, ignore
      }
      scannerRef.current = null;
    }
  }

  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (cancelled) return;
            try {
              const parsed = new URL(decodedText);
              if (
                parsed.origin === window.location.origin &&
                parsed.pathname.startsWith("/list/")
              ) {
                stopScanner().then(() => {
                  setScanning(false);
                  router.push(parsed.pathname);
                });
              }
            } catch {
              // not a valid URL, ignore
            }
          },
          () => {}
        );

        if (cancelled) {
          await stopScanner();
        } else {
          isRunningRef.current = true;
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("notallowed")) {
            setError("Kamerazugriff verweigert. Bitte erlaube den Kamerazugriff und versuche es erneut.");
          } else {
            setError("Kamera konnte nicht gestartet werden: " + msg);
          }
          setScanning(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  async function handleCancel() {
    await stopScanner();
    setScanning(false);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {!scanning ? (
        <button
          onClick={() => { setError(null); setScanning(true); }}
          className="
            px-6 py-2.5 rounded-[4px] border font-medium text-sm
            transition-transform duration-200 hover:scale-105 active:scale-95
          "
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
        >
          QR-Code scannen zum Beitreten
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full">
          <div
            id="qr-reader"
            className="w-full max-w-sm rounded-[4px] overflow-hidden border"
            style={{ borderColor: "var(--border-subtle)" }}
          />
          <button
            onClick={handleCancel}
            className="text-sm underline"
            style={{ color: "var(--border-strong)" }}
          >
            Abbrechen
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-center max-w-xs" style={{ color: "#d97757" }}>
          {error}
        </p>
      )}
    </div>
  );
}
