"use server";

import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export type AuthState = {
  error?: string;
  success?: boolean;
  message?: string;
};

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function ensureProfile(supabase: any, userId: string, email: string) {
  // Check if profile exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existing) {
    // Create profile if it doesn't exist
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      display_name: email.split("@")[0],
      email: email,
    });

    if (error) {
      console.error("Profile creation error:", error);
    }
  }
}

export async function signInWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Bitte E-Mail und Passwort eingeben." };
    }

    if (!isValidEmail(email)) {
      return { error: "E-Mail-Adresse ist ungültig." };
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log full error for debugging
      console.error("Supabase signIn error:", JSON.stringify(error, null, 2));

      // Handle specific Supabase error codes
      if (
        error.message.toLowerCase().includes("invalid") ||
        error.message.toLowerCase().includes("credentials")
      ) {
        return { error: "E-Mail oder Passwort ist falsch." };
      }

      // Show actual error message for debugging
      const errorCode = error.code ? `[${error.code}] ` : "";
      return {
        error: `Fehler: ${errorCode}${error.message}`,
      };
    }

    // Ensure profile exists after successful login
    if (data.user) {
      await ensureProfile(supabase, data.user.id, data.user.email || email);
    }

    redirect("/");
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

export async function signUpWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;

    if (!email || !password || !passwordConfirm) {
      return { error: "Bitte alle Felder ausfüllen." };
    }

    if (!isValidEmail(email)) {
      return { error: "E-Mail-Adresse ist ungültig." };
    }

    if (password !== passwordConfirm) {
      return { error: "Passwörter stimmen nicht überein." };
    }

    if (password.length < 6) {
      return { error: "Passwort muss mindestens 6 Zeichen lang sein." };
    }

    // Debug: Check if env vars are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase env vars:", {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });
      return { error: "Server-Konfigurationsfehler: Supabase nicht konfiguriert." };
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Log full error for debugging
      console.error("Supabase signUp error:", JSON.stringify(error, null, 2));

      // Handle specific Supabase error codes
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("user already exists") ||
        error.message.toLowerCase().includes("email already in use") ||
        error.code === "user_already_exists"
      ) {
        return { error: "Diese E-Mail ist bereits registriert." };
      }

      // Show actual error message for debugging
      const errorCode = error.code ? `[${error.code}] ` : "";
      return {
        error: `Fehler: ${errorCode}${error.message}`,
      };
    }


    return {
      success: true,
      message: "Bestätigungslink wurde an deine E-Mail gesendet.",
    };
  } catch (error) {
    console.error("Sign up error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: `Fehler: ${errorMessage}`,
    };
  }
}

export async function signInWithOAuth(provider: "google" | "github" | "apple") {
  const supabase = await createServerClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      return {
        error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
      };
    }

    if (data.url) {
      redirect(data.url);
    }
  } catch (error) {
    // Re-throw Next.js redirect errors
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("OAuth error:", error);
    return {
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const email = formData.get("email") as string;

    if (!email) {
      return { error: "Bitte E-Mail-Adresse eingeben." };
    }

    if (!isValidEmail(email)) {
      return { error: "E-Mail-Adresse ist ungültig." };
    }

    const supabase = await createServerClient();
    const headersList = await headers();
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/update-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      return {
        error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
      };
    }

    return {
      success: true,
      message: "Falls ein Konto mit dieser E-Mail existiert, wurde ein Link gesendet.",
    };
  } catch (error) {
    console.error("Password reset exception:", error);
    return {
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}
