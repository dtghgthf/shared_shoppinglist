import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateListId } from "@/lib/utils";
import { canViewList, isListOwner, getCurrentUserId } from "@/lib/auth/check-access";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const userId = await getCurrentUserId();

  // Check view access
  const hasAccess = await canViewList(userId, id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Kein Zugriff auf diese Liste" }, { status: 403 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("lists")
    .select("name, owner_id, visibility")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  try {
    const { id, name } = await request.json();
    if (!id || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const userId = await getCurrentUserId();

    // Only owner can rename list
    const isOwner = await isListOwner(userId, id);
    if (!isOwner) {
      return NextResponse.json({ error: "Nur der Besitzer kann die Liste umbenennen" }, { status: 403 });
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("lists")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const userId = await getCurrentUserId();

    // Only owner can delete list
    const isOwner = await isListOwner(userId, id);
    if (!isOwner) {
      return NextResponse.json({ error: "Nur der Besitzer kann die Liste löschen" }, { status: 403 });
    }

    const supabase = await createServerClient();
    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    console.log("[POST /api/lists] userId:", userId);
    
    const date = new Date();
    const dateStr = date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });

    // Count lists created today
    // Count lists created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const supabase = await createServerClient();

    const { count, error: countError } = await supabase
      .from("lists")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    const index = (count || 0) + 1;
    const name = `Einkaufsliste vom ${dateStr} (Nr. ${index})`;
    const id = generateListId();

    // Set owner_id if user is logged in, otherwise create unclaimed list
    const insertData = {
      id,
      name,
      owner_id: userId,
      visibility: userId ? "private" : "link_write" // Unclaimed lists are writable by anyone
    };

    const { data, error } = await supabase
      .from("lists")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // If FK constraint failed (user doesn't exist in auth.users), ask user to re-login
      if (error.code === "23503" && userId) {
        return NextResponse.json(
          { error: "Sitzung abgelaufen. Bitte melde dich erneut an.", code: "SESSION_INVALID" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Database error: ${error.code} - ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
