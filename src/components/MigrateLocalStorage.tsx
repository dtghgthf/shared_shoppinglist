"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { claimList } from "@/lib/list/actions";

interface StoredList {
  id: string;
  name?: string;
  isOwner?: boolean;
}

export default function MigrateLocalStorage() {
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const runMigration = async () => {
      try {
        // Check if migration has already been done
        const migrationFlag = localStorage.getItem(
          "shopping_list_history_migrated"
        );
        if (migrationFlag) return;

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get localStorage history
        const rawHistory = localStorage.getItem("shopping_list_history");
        if (!rawHistory) {
          // Mark as migrated even if there was no history
          localStorage.setItem("shopping_list_history_migrated", "true");
          return;
        }

        let lists: StoredList[] = [];
        try {
          lists = JSON.parse(rawHistory);
        } catch {
          console.error(
            "Failed to parse shopping_list_history from localStorage"
          );
          localStorage.setItem("shopping_list_history_migrated", "true");
          return;
        }

        if (!Array.isArray(lists) || lists.length === 0) {
          localStorage.setItem("shopping_list_history_migrated", "true");
          return;
        }

        // Filter to lists where user was owner
        const ownerLists = lists.filter((list) => list.isOwner === true);

        if (ownerLists.length === 0) {
          // Clear history and mark as migrated
          localStorage.removeItem("shopping_list_history");
          localStorage.setItem("shopping_list_history_migrated", "true");
          return;
        }

        // Try to claim each list
        let claimedCount = 0;
        const errors: string[] = [];

        for (const list of ownerLists) {
          if (!list.id) continue;

          const result = await claimList(list.id);
          if (result.success) {
            claimedCount++;
          } else {
            // Silently skip errors - list may already be claimed or not exist
            if (result.error && !result.error.includes("bereits einen Besitzer")) {
              errors.push(`${list.id}: ${result.error}`);
            }
          }
        }

        // Clear localStorage history after migration attempt
        localStorage.removeItem("shopping_list_history");
        localStorage.setItem("shopping_list_history_migrated", "true");

        // Show notification if any lists were claimed
        if (claimedCount > 0) {
          const message =
            claimedCount === 1
              ? "1 Liste wurde zu deinem Konto hinzugefügt"
              : `${claimedCount} Listen wurden zu deinem Konto hinzugefügt`;
          setNotificationMessage(message);
          setIsVisible(true);

          // Auto-hide notification after 5 seconds
          const timer = setTimeout(() => {
            setIsVisible(false);
          }, 5000);

          return () => clearTimeout(timer);
        }

        if (errors.length > 0) {
          console.warn("Migration errors:", errors);
        }
      } catch (error) {
        console.error("localStorage migration failed:", error);
        // Mark as migrated anyway to avoid retry loops
        localStorage.setItem("shopping_list_history_migrated", "true");
      }
    };

    runMigration();
  }, []);

  if (!isVisible || !notificationMessage) return null;

  return (
    <div
      className="fixed bottom-4 right-4 max-w-sm rounded-lg shadow-lg border animate-in fade-in slide-in-from-bottom-4 transition-all duration-200"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-subtle)",
        color: "var(--text-primary)",
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between gap-3 p-4">
        <p className="text-sm">{notificationMessage}</p>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-lg leading-none"
          style={{ color: "var(--border-strong)" }}
          aria-label="Benachrichtigung schließen"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
