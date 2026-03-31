"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, AuthState } from "@/lib/auth/actions";
import { ArrowLeft } from "lucide-react";
import ErrorMessage from "@/components/ErrorMessage";

const initialState: AuthState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <div className="flex flex-col gap-8 max-w-md mx-auto">
      <div className="text-center">
        <h1
          className="heading text-4xl font-normal mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Passwort zurücksetzen
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Gib deine E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten.
        </p>
      </div>

      <div
        className="p-6 rounded-[4px]"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {state.success ? (
          <div
            className="p-4 rounded-[4px] text-center"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              color: "#16a34a",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            }}
          >
            <p className="font-medium mb-1">E-Mail gesendet!</p>
            <p className="text-sm">{state.message}</p>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={pending}
              className="w-full px-4 py-3 rounded-[4px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {pending ? "Wird gesendet..." : "E-Mail senden"}
            </button>
          </form>
        )}
      </div>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm transition-colors duration-200 hover:underline"
        style={{ color: "var(--accent)" }}
      >
        <ArrowLeft size={16} />
        Zurück zur Anmeldung
      </Link>
    </div>
  );
}
