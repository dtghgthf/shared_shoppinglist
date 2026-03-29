import type { Metadata } from "next";
import "./globals.css";
import DarkModeToggle from "@/components/DarkModeToggle";

export const metadata: Metadata = {
  title: "Geteilte Einkaufsliste",
  description: "Erstelle und teile Einkaufslisten in Echtzeit mit Freunden.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      {/* Prevent dark mode flash — runs before React hydrates, hence the className mismatch is intentional */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||((!t)&&p)){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div
          className="max-w-2xl mx-auto px-6 py-10 min-h-screen"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <div className="flex justify-end mb-6">
            <DarkModeToggle />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
