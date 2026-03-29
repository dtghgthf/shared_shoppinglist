import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { list_id, text, category } = await request.json();
    if (!list_id || !text?.trim()) {
      return NextResponse.json({ error: "list_id and text sind erforderlich" }, { status: 400 });
    }

    const supabase = createServerClient();

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

    // Allow updating: checked, order_index, category
    const allowed = ["checked", "order_index", "category"];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) patch[key] = updates[key];
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Keine gültigen Felder zum Aktualisieren" }, { status: 400 });
    }

    const supabase = createServerClient();
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
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id ist erforderlich" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
