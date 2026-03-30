import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateListId } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("lists")
    .select("name")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  try {
    const { id, name } = await request.json();
    if (!id || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const supabase = createServerClient();
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

    const supabase = createServerClient();
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

export async function POST(request: Request) {
  try {
    const date = new Date();
    const dateStr = date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });

    // Count lists created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const supabase = createServerClient();

    const { count, error: countError } = await supabase
      .from("lists")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    const index = (count || 0) + 1;
    const name = `Einkaufsliste vom ${dateStr} (Nr. ${index})`;
    const id = generateListId();

    const { data, error } = await supabase
      .from("lists")
      .insert({ id, name })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
