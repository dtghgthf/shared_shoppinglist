"use client";

import { useEffect, useRef, useState } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/auth/profile-actions";

interface Props {
  user: {
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

export default function UserMenu({ user }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user.displayName || user.email?.split("@")[0] || "Benutzer";
  const initials = getInitials(user.displayName, user.email);

  async function handleSignOut() {
    setIsOpen(false);
    await signOut();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-[4px] transition-colors duration-150 hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Benutzermenü öffnen"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              backgroundColor: "var(--accent)",
              color: "white",
            }}
          >
            {initials}
          </div>
        )}
        <ChevronDown
          size={14}
          className="transition-transform duration-150"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-[8px] shadow-lg border z-50 overflow-hidden"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {/* User Info Header */}
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {displayName}
            </p>
            {user.email && (
              <p
                className="text-xs truncate mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {user.email}
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--item-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <User size={16} style={{ color: "var(--text-secondary)" }} />
              Profil
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2.5 text-sm w-full transition-colors duration-150"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--item-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <LogOut size={16} style={{ color: "var(--text-secondary)" }} />
              Abmelden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
