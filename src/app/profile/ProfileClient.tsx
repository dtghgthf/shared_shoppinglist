"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Check, X, Pencil } from "lucide-react";
import Link from "next/link";
import ConnectedAccounts from "@/components/ConnectedAccounts";
import {
  updateProfile,
  updatePassword,
  deleteAccount,
} from "@/lib/auth/profile-actions";

interface Identity {
  id: string;
  provider: string;
  identity_data?: {
    email?: string;
    name?: string;
    avatar_url?: string;
  };
}

interface Props {
  user: {
    id: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  identities: Identity[];
  hasEmailAuth: boolean;
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

export default function ProfileClient({
  user,
  identities,
  hasEmailAuth,
}: Props) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [nameError, setNameError] = useState<string | null>(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isPending, startTransition] = useTransition();

  const initials = getInitials(user.displayName, user.email);

  async function handleSaveName() {
    setNameError(null);

    const formData = new FormData();
    formData.append("display_name", displayName);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setNameError(result.error);
      } else {
        setIsEditingName(false);
      }
    });
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) {
        setPasswordError(result.error);
      } else {
        setPasswordSuccess(true);
        setShowPasswordForm(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  async function handleDeleteAccount() {
    startTransition(async () => {
      await deleteAccount();
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-[4px] transition-colors duration-150"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Zurück zur Startseite"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1
          className="text-2xl font-bold heading"
          style={{ color: "var(--text-primary)" }}
        >
          Profil
        </h1>
      </div>

      {/* Avatar & Name Section */}
      <div
        className="p-6 rounded-[8px] border"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName || "Avatar"}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Name & Email */}
          <div className="flex-1 min-w-0">
            {/* Display Name */}
            <div className="mb-2">
              <label
                className="text-xs uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-secondary)" }}
              >
                Anzeigename
              </label>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-[4px] border text-sm outline-none focus:ring-2"
                    style={{
                      backgroundColor: "var(--bg)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": "var(--accent)",
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setIsEditingName(false);
                        setDisplayName(user.displayName || "");
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isPending}
                    className="p-1.5 rounded-[4px] transition-colors duration-150"
                    style={{ color: "var(--accent)" }}
                    aria-label="Speichern"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setDisplayName(user.displayName || "");
                      setNameError(null);
                    }}
                    className="p-1.5 rounded-[4px] transition-colors duration-150"
                    style={{ color: "var(--text-secondary)" }}
                    aria-label="Abbrechen"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.displayName || "Nicht festgelegt"}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded-[4px] transition-colors duration-150 hover:opacity-70"
                    style={{ color: "var(--text-secondary)" }}
                    aria-label="Name bearbeiten"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              {nameError && (
                <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                  {nameError}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label
                className="text-xs uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-secondary)" }}
              >
                E-Mail
              </label>
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {user.email || "Keine E-Mail"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div
        className="p-6 rounded-[8px] border"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <ConnectedAccounts identities={identities} hasEmailAuth={hasEmailAuth} />
      </div>

      {/* Change Password - only for email auth users */}
      {hasEmailAuth && (
        <div
          className="p-6 rounded-[8px] border"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <h2
            className="text-lg font-semibold heading mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Passwort ändern
          </h2>

          {passwordSuccess && (
            <div
              className="px-4 py-3 rounded-[4px] text-sm mb-4"
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                color: "#22c55e",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              Passwort erfolgreich geändert!
            </div>
          )}

          {showPasswordForm ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div
                  className="px-4 py-3 rounded-[4px] text-sm"
                  style={{
                    backgroundColor: "rgba(220, 38, 38, 0.1)",
                    color: "#dc2626",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                  }}
                >
                  {passwordError}
                </div>
              )}

              <div>
                <label
                  htmlFor="current_password"
                  className="text-xs uppercase tracking-wider mb-1 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Aktuelles Passwort
                </label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  required
                  className="w-full px-3 py-2 rounded-[4px] border text-sm outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--bg)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="new_password"
                  className="text-xs uppercase tracking-wider mb-1 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Neues Passwort
                </label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-[4px] border text-sm outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--bg)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm_password"
                  className="text-xs uppercase tracking-wider mb-1 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Passwort bestätigen
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-[4px] border text-sm outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--bg)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-[4px] text-sm font-medium transition-colors duration-150 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "white",
                  }}
                >
                  {isPending ? "Speichern..." : "Passwort ändern"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError(null);
                  }}
                  className="px-4 py-2 rounded-[4px] text-sm font-medium transition-colors duration-150 border"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="px-4 py-2 rounded-[4px] text-sm font-medium transition-colors duration-150 border"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              Passwort ändern
            </button>
          )}
        </div>
      )}

      {/* Delete Account */}
      <div
        className="p-6 rounded-[8px] border"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <h2
          className="text-lg font-semibold heading mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Konto löschen
        </h2>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          Wenn du dein Konto löschst, werden alle deine Daten unwiderruflich entfernt.
        </p>

        {showDeleteConfirm ? (
          <div className="space-y-3">
            <p
              className="text-sm font-medium"
              style={{ color: "#dc2626" }}
            >
              Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isPending}
                className="px-4 py-2 rounded-[4px] text-sm font-medium transition-colors duration-150 disabled:opacity-50"
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                }}
              >
                {isPending ? "Löschen..." : "Ja, Konto löschen"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-[4px] text-sm font-medium transition-colors duration-150 border"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-[4px] text-sm font-medium transition-colors duration-150 border"
            style={{
              borderColor: "#dc2626",
              color: "#dc2626",
            }}
          >
            Konto löschen
          </button>
        )}
      </div>
    </div>
  );
}
