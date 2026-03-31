import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();

    // Fetch all lists with item count
    const { data: lists, error: listsError } = await supabase
      .from("lists")
      .select(
        `
        id,
        name,
        created_at,
        items(count)
      `
      )
      .order("created_at", { ascending: false });

    if (listsError) throw listsError;

    // Transform: extract item count from nested structure
    const transformedLists = (lists || []).map((list: any) => ({
      id: list.id,
      name: list.name,
      created_at: list.created_at,
      item_count: list.items?.[0]?.count ?? 0,
    }));

    return NextResponse.json(transformedLists);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/admin/lists error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id ist erforderlich" }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Delete list (CASCADE will delete all items)
    const { error } = await supabase.from("lists").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("DELETE /api/admin/lists error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
