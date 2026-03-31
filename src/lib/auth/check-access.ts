import { createServerClient } from "@/lib/supabase/server";
import type { ListVisibility } from "@/lib/types";

export type ListRole = "owner" | "editor" | "viewer" | null;

interface ListAccessInfo {
  owner_id: string | null;
  visibility: ListVisibility;
}

/**
 * Get user's role in a list based on ownership and membership
 */
export async function getListRole(
  userId: string | null,
  listId: string
): Promise<ListRole> {
  const supabase = await createServerClient();

  // Get list info
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("owner_id, visibility")
    .eq("id", listId)
    .single();

  if (listError || !list) return null;

  const listInfo = list as ListAccessInfo;

  // Check if user is owner
  if (userId && listInfo.owner_id === userId) {
    return "owner";
  }

  // Check membership if user is logged in
  if (userId) {
    const { data: membership } = await supabase
      .from("list_members")
      .select("role")
      .eq("list_id", listId)
      .eq("user_id", userId)
      .single();

    if (membership?.role) {
      return membership.role as ListRole;
    }
  }

  return null;
}

/**
 * Check if user can view a list
 * - Owner: yes
 * - Member (any role): yes
 * - link_read or link_write visibility: yes (anyone)
 * - Unclaimed list (owner_id is null): yes
 * - private: only owner/members
 */
export async function canViewList(
  userId: string | null,
  listId: string
): Promise<boolean> {
  const supabase = await createServerClient();

  const { data: list } = await supabase
    .from("lists")
    .select("owner_id, visibility")
    .eq("id", listId)
    .single();

  if (!list) return false;

  const listInfo = list as ListAccessInfo;

  // Unclaimed lists are accessible to anyone
  if (listInfo.owner_id === null) return true;

  // Link-based visibility allows anyone to view
  if (listInfo.visibility === "link_read" || listInfo.visibility === "link_write") {
    return true;
  }

  // No user logged in and list is private
  if (!userId) return false;

  // Owner can always view
  if (listInfo.owner_id === userId) return true;

  // Check membership
  const { data: membership } = await supabase
    .from("list_members")
    .select("role")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .single();

  return !!membership;
}

/**
 * Check if user can edit a list (add/modify/delete items)
 * - Owner: yes
 * - Editor member: yes
 * - link_write visibility: yes (anyone)
 * - Unclaimed list (owner_id is null): yes
 * - Viewer member or link_read: no
 */
export async function canEditList(
  userId: string | null,
  listId: string
): Promise<boolean> {
  const supabase = await createServerClient();

  const { data: list } = await supabase
    .from("lists")
    .select("owner_id, visibility")
    .eq("id", listId)
    .single();

  if (!list) return false;

  const listInfo = list as ListAccessInfo;

  // Unclaimed lists are editable by anyone
  if (listInfo.owner_id === null) return true;

  // link_write allows anyone to edit
  if (listInfo.visibility === "link_write") return true;

  // No user logged in and not link_write
  if (!userId) return false;

  // Owner can always edit
  if (listInfo.owner_id === userId) return true;

  // Check if member with editor role
  const { data: membership } = await supabase
    .from("list_members")
    .select("role")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .single();

  return membership?.role === "editor" || membership?.role === "owner";
}

/**
 * Check if user is the owner of a list
 */
export async function isListOwner(
  userId: string | null,
  listId: string
): Promise<boolean> {
  if (!userId) return false;

  const supabase = await createServerClient();

  const { data: list } = await supabase
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  return list?.owner_id === userId;
}

/**
 * Get current authenticated user ID from Supabase session
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
