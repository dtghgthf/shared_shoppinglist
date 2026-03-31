"use client";

import { useState, useTransition } from "react";
import { linkOAuthProvider, unlinkOAuthProvider } from "@/lib/auth/profile-actions";

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
  identities: Identity[];
  hasEmailAuth: boolean;
}

const PROVIDERS = [
  { id: "google", name: "Google", icon: "🔵" },
  { id: "github", name: "GitHub", icon: "⚫" },
  { id: "apple", name: "Apple", icon: "🍎" },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

export default function ConnectedAccounts({ identities, hasEmailAuth }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const connectedProviders = new Map(
    identities.map((i) => [i.provider, i])
  );

  // Can only unlink if there's another way to sign in
  const canUnlink = identities.length > 1 || hasEmailAuth;

  async function handleLink(provider: ProviderId) {
    setError(null);
    setPendingProvider(provider);

    startTransition(async () => {
      const result = await linkOAuthProvider(provider);
      if (result?.error) {
        setError(result.error);
      }
      setPendingProvider(null);
    });
  }

  async function handleUnlink(identityId: string, provider: string) {
    if (!canUnlink) {
      setError("Du musst mindestens eine Anmeldemethode behalten");
      return;
    }

    setError(null);
    setPendingProvider(provider);

    startTransition(async () => {
      const result = await unlinkOAuthProvider(identityId);
      if (result?.error) {
        setError(result.error);
      }
      setPendingProvider(null);
    });
  }

  return (
    <div className="space-y-4">
      <h2
        className="text-lg font-semibold heading"
        style={{ color: "var(--text-primary)" }}
      >
        Verknüpfte Konten
      </h2>

      {error && (
        <div
          className="px-4 py-3 rounded-[4px] text-sm"
          style={{
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            color: "#dc2626",
            border: "1px solid rgba(220, 38, 38, 0.2)",
          }}
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        {PROVIDERS.map((provider) => {
          const identity = connectedProviders.get(provider.id);
          const isConnected = !!identity;
          const isLoading = isPending && pendingProvider === provider.id;

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between px-4 py-3 rounded-[4px] border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{provider.icon}</span>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {provider.name}
                  </p>
                  {identity?.identity_data?.email && (
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {identity.identity_data.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isConnected && (
                  <span
                    className="text-xs px-2 py-1 rounded-[4px]"
                    style={{
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      color: "#22c55e",
                    }}
                  >
                    Verbunden
                  </span>
                )}

                {isConnected ? (
                  <button
                    onClick={() => handleUnlink(identity!.id, provider.id)}
                    disabled={isLoading || !canUnlink}
                    className="text-xs px-3 py-1.5 rounded-[4px] border transition-colors duration-150 disabled:opacity-50"
                    style={{
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {isLoading ? "..." : "Trennen"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLink(provider.id)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-[4px] transition-colors duration-150 disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "white",
                    }}
                  >
                    {isLoading ? "..." : "Verbinden"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!canUnlink && (
        <p
          className="text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          Füge eine weitere Anmeldemethode hinzu, bevor du eine bestehende trennst.
        </p>
      )}
    </div>
  );
}
