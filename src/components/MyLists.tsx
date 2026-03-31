"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, RefreshCw, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { leaveList } from "@/lib/list/actions";

interface UserList {
  id: string;
  name: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "Besitzer";
    case "editor":
      return "Bearbeiter";
    case "viewer":
      return "Betrachter";
    default:
      return "Gast";
  }
}

export default function MyLists() {
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchLists() {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsAuthenticated(false);
      setLists([]);
      setLoading(false);
      return;
    }
    
    setIsAuthenticated(true);

    // Fetch owned lists
    const { data: ownedLists } = await supabase
      .from("lists")
      .select("id, name, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch lists where user is a member
    const { data: memberships } = await supabase
      .from("list_members")
      .select("list_id, role, lists(id, name, created_at)")
      .eq("user_id", user.id);

    const userLists: UserList[] = [];

    // Add owned lists
    if (ownedLists) {
      for (const list of ownedLists) {
        userLists.push({
          id: list.id,
          name: list.name,
          role: "owner",
          created_at: list.created_at,
        });
      }
    }

    // Add member lists
    if (memberships) {
      for (const membership of memberships) {
        const lists = membership.lists;
        const listData = Array.isArray(lists) ? lists[0] : lists as { id: string; name: string; created_at: string } | null;
        if (listData && !userLists.some((l) => l.id === listData.id)) {
          userLists.push({
            id: listData.id,
            name: listData.name,
            role: membership.role as "editor" | "viewer",
            created_at: listData.created_at,
          });
        }
      }
    }

    // Sort by created_at descending
    userLists.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setLists(userLists);
    setLoading(false);
  }

  useEffect(() => {
    fetchLists();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Liste wirklich löschen?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lists?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setLists((prev) => prev.filter((l) => l.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Löschen");
      }
    } catch {
      alert("Fehler beim Löschen");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLeave(id: string) {
    if (!confirm("Liste wirklich verlassen?")) return;
    
    setDeletingId(id);
    try {
      const result = await leaveList(id);
      if (result.success) {
        setLists((prev) => prev.filter((l) => l.id !== id));
      } else {
        alert(result.error || "Fehler beim Verlassen");
      }
    } catch {
      alert("Fehler beim Verlassen");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4" style={{ color: "var(--text-secondary)" }}>
        <RefreshCw size={14} className="animate-spin" />
        <span className="text-sm">Lade Listen...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (lists.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Du hast noch keine Listen. Erstelle eine neue Liste!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 
        className="text-xs font-semibold uppercase tracking-widest" 
        style={{ color: "var(--border-strong)" }}
      >
        Meine Listen
      </h2>
      <div className="flex flex-col gap-2">
        {lists.map((list) => (
          <div
            key={list.id}
            className="flex items-center justify-between p-3 rounded-[4px] border"
            style={{ 
              borderColor: "var(--border-subtle)", 
              backgroundColor: "var(--bg-elevated)" 
            }}
          >
            <div className="flex flex-col">
              <Link 
                href={`/list/${list.id}`} 
                className="font-medium hover:underline" 
                style={{ color: "var(--text-primary)" }}
              >
                {list.name}
              </Link>
              <span 
                className="text-[10px] uppercase tracking-wider" 
                style={{ color: "var(--border-strong)" }}
              >
                {getRoleLabel(list.role)}
              </span>
            </div>
            {list.role === "owner" ? (
              <button
                onClick={() => handleDelete(list.id)}
                disabled={deletingId === list.id}
                className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors disabled:opacity-50"
                title="Liste löschen"
              >
                <Trash2 
                  size={16} 
                  className={deletingId === list.id ? "animate-pulse" : ""} 
                  style={{ color: "#ef4444" }}
                />
              </button>
            ) : (
              <button
                onClick={() => handleLeave(list.id)}
                disabled={deletingId === list.id}
                className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors disabled:opacity-50"
                title="Liste verlassen"
              >
                <LogOut 
                  size={16} 
                  className={deletingId === list.id ? "animate-pulse" : ""} 
                  style={{ color: "#ef4444" }}
                />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
