import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user signed up with email (has password-based identity)
  const hasEmailAuth = user.identities?.some(
    (identity) => identity.provider === "email"
  ) ?? false;

  const identities = user.identities || [];

  return (
    <ProfileClient
      user={{
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.display_name,
        avatarUrl: user.user_metadata?.avatar_url,
      }}
      identities={identities.map((i) => ({
        id: i.id,
        provider: i.provider,
        identity_data: i.identity_data,
      }))}
      hasEmailAuth={hasEmailAuth}
    />
  );
}
