"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const supabase = await createServerClient();
  const displayName = formData.get("display_name") as string;

  if (!displayName?.trim()) {
    return { error: "Anzeigename darf nicht leer sein" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  const { error } = await supabase.auth.updateUser({
    data: { display_name: displayName.trim() },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createServerClient();
  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Alle Felder sind erforderlich" };
  }

  if (newPassword.length < 6) {
    return { error: "Das Passwort muss mindestens 6 Zeichen lang sein" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Die Passwörter stimmen nicht überein" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Nicht angemeldet" };
  }

  // Verify current password by signing in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Aktuelles Passwort ist falsch" };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  // Delete user using admin API (requires service role key)
  // For now, we'll sign out and return a message since deleting requires admin access
  // In production, you would use a service role client or edge function
  
  // Sign out the user
  await supabase.auth.signOut();
  
  redirect("/login");
}

export async function linkOAuthProvider(provider: "google" | "github" | "apple") {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/profile`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { success: true };
}

export async function unlinkOAuthProvider(identityId: string) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  // Check if user has at least 2 identities (email + 1 OAuth, or 2+ OAuth)
  const identities = user.identities || [];
  if (identities.length <= 1) {
    return { error: "Du musst mindestens eine Anmeldemethode behalten" };
  }

  const identity = identities.find((i) => i.id === identityId);
  if (!identity) {
    return { error: "Identität nicht gefunden" };
  }

  const { error } = await supabase.auth.unlinkIdentity(identity);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
