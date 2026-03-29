import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateListId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name || "My Shopping List";
    const id = generateListId();

    const supabase = createServerClient();
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
