"use server";

import { createServerClient } from "@/lib/supabase/server";

export type ListVisibility = "private" | "link_read" | "link_write";
export type MemberRole = "viewer" | "editor" | "owner";

export interface ListMember {
  user_id: string;
  role: MemberRole;
  joined_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ListWithAccess {
  id: string;
  name: string;
  owner_id: string | null;
  visibility: ListVisibility;
  created_at: string;
  isOwner: boolean;
  canEdit: boolean;
  userRole: MemberRole | null;
}

async function getCurrentUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getListAccess(listId: string): Promise<ListWithAccess | null> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  const { data: list, error } = await supabase
    .from("lists")
    .select("id, name, owner_id, visibility, created_at")
    .eq("id", listId)
    .single();

  if (error || !list) return null;

  let userRole: MemberRole | null = null;
  let isOwner = false;
  let canEdit = false;

  if (user) {
    isOwner = list.owner_id === user.id;
    
    if (isOwner) {
      userRole = "owner";
      canEdit = true;
    } else {
      const { data: membership } = await supabase
        .from("list_members")
        .select("role")
        .eq("list_id", listId)
        .eq("user_id", user.id)
        .single();

      if (membership) {
        userRole = membership.role as MemberRole;
        canEdit = userRole === "editor" || userRole === "owner";
      }
    }
  }

  // Check visibility-based access
  if (!canEdit && list.visibility === "link_write") {
    canEdit = true;
  }

  // Unclaimed lists can be edited by anyone
  if (!list.owner_id) {
    canEdit = true;
  }

  return {
    ...list,
    visibility: (list.visibility || "private") as ListVisibility,
    isOwner,
    canEdit,
    userRole,
  };
}

export async function getListMembers(listId: string): Promise<ListMember[]> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    console.log("[getListMembers] No user logged in");
    return [];
  }

  // Check if user has access to view members (owner or member)
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (!list) {
    console.log("[getListMembers] List not found");
    return [];
  }

  const isOwner = list.owner_id === user.id;
  
  if (!isOwner) {
    const { data: membership } = await supabase
      .from("list_members")
      .select("role")
      .eq("list_id", listId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      console.log("[getListMembers] User is not owner or member");
      return [];
    }
  }

  // Get list_members 
  const { data: members, error } = await supabase
    .from("list_members")
    .select("user_id, role, joined_at")
    .eq("list_id", listId);

  console.log("[getListMembers] Members query result:", { error, count: members?.length || 0 });

  if (error) {
    console.error("[getListMembers] Query error:", error);
    return [];
  }

  // Collect all user IDs (members + owner)
  const userIds = new Set<string>();
  if (list.owner_id) userIds.add(list.owner_id);
  if (members) members.forEach((m) => userIds.add(m.user_id));

  // Get all profiles for these users
  const userIdsArray = Array.from(userIds);
  let allMembers: ListMember[] = [];

  if (userIdsArray.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, email, avatar_url")
      .in("id", userIdsArray);

    console.log("[getListMembers] Profiles query result:", { profileError, count: profiles?.length || 0 });

    if (profileError) {
      console.error("[getListMembers] Profile query error:", profileError);
    }

    // Map profiles by user_id
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Add owner
    if (list.owner_id) {
      const ownerProfile = profileMap.get(list.owner_id);
      allMembers.push({
        user_id: list.owner_id,
        role: "owner",
        joined_at: new Date().toISOString(),
        display_name: ownerProfile?.display_name || ownerProfile?.email || null,
        avatar_url: ownerProfile?.avatar_url || null,
      });
    }

    // Add members
    if (members) {
      members.forEach((m) => {
        const profile = profileMap.get(m.user_id);
        allMembers.push({
          user_id: m.user_id,
          role: m.role as MemberRole,
          joined_at: m.joined_at,
          display_name: profile?.display_name || profile?.email || null,
          avatar_url: profile?.avatar_url || null,
        });
      });
    }
  }

  console.log("[getListMembers] Final members:", allMembers.length);
  return allMembers;
}

export async function updateListVisibility(
  listId: string,
  visibility: ListVisibility
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Nicht angemeldet" };
  }

  // Check if user is owner
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (!list) {
    return { success: false, error: "Liste nicht gefunden" };
  }

  if (list.owner_id !== user.id) {
    return { success: false, error: "Nur der Besitzer kann die Sichtbarkeit ändern" };
  }

  const { error } = await supabase
    .from("lists")
    .update({ visibility })
    .eq("id", listId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function addListMember(
  listId: string,
  userId: string,
  role: MemberRole = "viewer"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Nicht angemeldet" };
  }

  // Check if user is owner
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (!list) {
    return { success: false, error: "Liste nicht gefunden" };
  }

  if (list.owner_id !== user.id) {
    return { success: false, error: "Nur der Besitzer kann Mitglieder hinzufügen" };
  }

  // Cannot add owner as member
  if (userId === list.owner_id) {
    return { success: false, error: "Der Besitzer ist bereits Mitglied" };
  }

  const { error } = await supabase
    .from("list_members")
    .upsert({ list_id: listId, user_id: userId, role });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeListMember(
  listId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Nicht angemeldet" };
  }

  // Check if user is owner
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (!list) {
    return { success: false, error: "Liste nicht gefunden" };
  }

  if (list.owner_id !== user.id) {
    return { success: false, error: "Nur der Besitzer kann Mitglieder entfernen" };
  }

  const { error } = await supabase
    .from("list_members")
    .delete()
    .eq("list_id", listId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateMemberRole(
  listId: string,
  userId: string,
  role: MemberRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Nicht angemeldet" };
  }

  // Check if user is owner
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (!list) {
    return { success: false, error: "Liste nicht gefunden" };
  }

  if (list.owner_id !== user.id) {
    return { success: false, error: "Nur der Besitzer kann Rollen ändern" };
  }

  // Cannot change owner role through this function
  if (role === "owner") {
    return { success: false, error: "Besitzerrolle kann nicht zugewiesen werden" };
  }

  const { error } = await supabase
    .from("list_members")
    .update({ role })
    .eq("list_id", listId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function claimList(listId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Nicht angemeldet" };
  }

  // Check if list exists and is unclaimed
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (!list) {
    return { success: false, error: "Liste nicht gefunden" };
  }

  if (list.owner_id !== null) {
    return { success: false, error: "Diese Liste hat bereits einen Besitzer" };
  }

  const { error } = await supabase
    .from("lists")
    .update({ owner_id: user.id, visibility: "private" })
    .eq("id", listId)
    .is("owner_id", null);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function leaveList(listId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Nicht angemeldet" };
  }

  // Check if user is a member (not owner)
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (!list) {
    return { success: false, error: "Liste nicht gefunden" };
  }

  if (list.owner_id === user.id) {
    return { success: false, error: "Der Besitzer kann die Liste nicht verlassen" };
  }

  const { error } = await supabase
    .from("list_members")
    .delete()
    .eq("list_id", listId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function autoJoinList(
  listId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    console.log("[autoJoinList] No user");
    return { success: false, error: "Nicht angemeldet" };
  }

  // Get the list to check if it's link-accessible
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id, visibility")
    .eq("id", listId)
    .single();

  if (!list) {
    console.log("[autoJoinList] List not found");
    return { success: false, error: "Liste nicht gefunden" };
  }

  console.log("[autoJoinList] List info:", { visibility: list.visibility, isOwner: list.owner_id === user.id });

  // Don't add owner as member (they already have access)
  if (list.owner_id === user.id) {
    console.log("[autoJoinList] User is owner");
    return { success: true }; // Already owner
  }

  // Check if list is link-accessible
  if (!["link_read", "link_write"].includes(list.visibility)) {
    console.log("[autoJoinList] List not link-accessible");
    return { success: false, error: "Diese Liste ist nicht über Link zugänglich" };
  }

  // Check if user is already a member
  const { data: existing } = await supabase
    .from("list_members")
    .select("user_id")
    .eq("list_id", listId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    console.log("[autoJoinList] User already member");
    return { success: true }; // Already a member
  }

  // Determine role based on visibility
  const role = list.visibility === "link_write" ? "editor" : "viewer";

  console.log("[autoJoinList] Adding user as member with role:", role);

  // Add user as member
  const { error } = await supabase
    .from("list_members")
    .insert({ list_id: listId, user_id: user.id, role });

  if (error) {
    console.error("[autoJoinList] Insert error:", error);
    return { success: false, error: error.message };
  }

  console.log("[autoJoinList] Successfully added member");
  return { success: true };
}

export async function getListMembersWithEmails(listId: string): Promise<ListMember[]> {
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return [];

  // Check if user has access
  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (!list) return [];

  const isOwner = list.owner_id === user.id;
  
  if (!isOwner) {
    const { data: membership } = await supabase
      .from("list_members")
      .select("role")
      .eq("list_id", listId)
      .eq("user_id", user.id)
      .single();

    if (!membership) return [];
  }

  // Call a custom SQL query to get members with emails from auth.users
  // We'll use raw SQL via supabase client
  const { data: membersWithEmails, error } = await supabase
    .rpc('get_list_members_with_emails', { p_list_id: listId });

  console.log("[getListMembersWithEmails] RPC result:", { 
    error, 
    count: membersWithEmails?.length || 0,
    sample: membersWithEmails?.[0]
  });

  if (error) {
    console.error("[getListMembersWithEmails] Error:", error);
    // Fallback to old method
    return getListMembers(listId);
  }

  const mapped = (membersWithEmails || []).map((m: any) => ({
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    display_name: m.display_name || m.email || null,
    avatar_url: m.avatar_url,
  }));

  console.log("[getListMembersWithEmails] Mapped result:", mapped);
  return mapped;
}
