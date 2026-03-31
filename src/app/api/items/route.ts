import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { canEditList, getCurrentUserId } from "@/lib/auth/check-access";

export async function POST(request: Request) {
  try {
    const { list_id, text, category } = await request.json();
    if (!list_id || !text?.trim()) {
      return NextResponse.json({ error: "list_id and text sind erforderlich" }, { status: 400 });
    }

    const userId = await getCurrentUserId();

    // Check edit access
    const hasAccess = await canEditList(userId, list_id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Keine Berechtigung zum Bearbeiten dieser Liste" }, { status: 403 });
    }

    const supabase = await createServerClient();

    // Get current max order_index for this list
    const { data: maxRow } = await supabase
      .from("items")
      .select("order_index")
      .eq("list_id", list_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const order_index = (maxRow?.order_index ?? 0) + 1000;

    const { data, error } = await supabase
      .from("items")
      .insert({
        list_id,
        text: text.trim(),
        checked: false,
        category: category || "sonstiges",
        order_index,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id ist erforderlich" }, { status: 400 });
    }

    const userId = await getCurrentUserId();
    const supabase = await createServerClient();

    // Get item to find its list_id
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("list_id")
      .eq("id", id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 });
    }

    // Check edit access
    const hasAccess = await canEditList(userId, item.list_id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Keine Berechtigung zum Bearbeiten dieser Liste" }, { status: 403 });
    }

    // Allow updating: checked, order_index, category, text
    const allowed = ["checked", "order_index", "category", "text"];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) patch[key] = updates[key];
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Keine gültigen Felder zum Aktualisieren" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("items")
      .update(patch)
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
    const { id, list_id, deleteChecked } = await request.json();
    
    const userId = await getCurrentUserId();
    const supabase = await createServerClient();

    // Delete all checked items for a list
    if (deleteChecked && list_id) {
      // Check edit access
      const hasAccess = await canEditList(userId, list_id);
      if (!hasAccess) {
        return NextResponse.json({ error: "Keine Berechtigung zum Bearbeiten dieser Liste" }, { status: 403 });
      }

      const { error } = await supabase
        .from("items")
        .delete()
        .eq("list_id", list_id)
        .eq("checked", true);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }
    
    // Delete single item
    if (!id) {
      return NextResponse.json({ error: "id ist erforderlich" }, { status: 400 });
    }

    // Get item to find its list_id
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("list_id")
      .eq("id", id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 });
    }

    // Check edit access
    const hasAccess = await canEditList(userId, item.list_id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Keine Berechtigung zum Bearbeiten dieser Liste" }, { status: 403 });
    }

    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
