import CreateListButton from "@/components/CreateListButton";
import QrCodeScanner from "@/components/QrCodeScanner";
import ListHistory from "@/components/ListHistory";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-4">
        <h1 className="heading text-5xl font-normal leading-tight" style={{ color: "var(--text-primary)" }}>
          Geteilte<br />
          <span style={{ color: "var(--accent)" }}>Einkaufslisten</span>
        </h1>
        <p className="text-base max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Erstelle eine Liste, teile den QR-Code mit Freunden und
          geht zusammen einkaufen — alle Änderungen erscheinen sofort bei allen.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
          Neue Liste
        </h2>
        <CreateListButton />
        <ListHistory />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
        <span className="text-sm" style={{ color: "var(--border-strong)" }}>oder beitreten</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
          Liste beitreten
        </h2>
        <QrCodeScanner />
      </div>
    </div>
  );
}
