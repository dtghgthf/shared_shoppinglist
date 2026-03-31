"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithEmail, AuthState } from "@/lib/auth/actions";
import OAuthButtons from "@/components/OAuthButtons";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInWithEmail, initialState);

  return (
    <div className="flex flex-col gap-8 max-w-md mx-auto">
      <div className="text-center">
        <h1
          className="heading text-4xl font-normal mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Anmelden
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Melde dich an, um deine Einkaufslisten zu verwalten.
        </p>
      </div>

      <div
        className="p-6 rounded-[4px]"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && <ErrorMessage message={state.error} dismissable={true} />}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-3 rounded-[4px] text-base outline-none transition-all duration-200"
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
              placeholder="name@beispiel.de"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 rounded-[4px] text-base outline-none transition-all duration-200"
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
              placeholder="••••••••"
            />
          </div>

          <div className="text-right">
            <Link
              href="/reset-password"
              className="text-sm transition-colors duration-200 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Passwort vergessen?
            </Link>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full px-4 py-3 rounded-[4px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {pending ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Wird angemeldet...</span>
              </>
            ) : (
              "Anmelden"
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
          <span className="text-sm" style={{ color: "var(--border-strong)" }}>
            oder
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>

        <OAuthButtons />
      </div>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Noch kein Konto?{" "}
        <Link
          href="/signup"
          className="font-medium transition-colors duration-200 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Registrieren
        </Link>
      </p>
    </div>
  );
}
