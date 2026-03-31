import { createServerClient } from "@/lib/supabase/server";
import GlobalToolbar from "./GlobalToolbar";
import UserMenu from "./UserMenu";

export default async function HeaderToolbar() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex items-center justify-end gap-2">
      <GlobalToolbar />
      {user && (
        <UserMenu
          user={{
            email: user.email,
            displayName: user.user_metadata?.display_name,
            avatarUrl: user.user_metadata?.avatar_url,
          }}
        />
      )}
    </div>
  );
}
