import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { detectCategory } from "@/lib/categories";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const listId = formData.get("list_id") as string;

    if (!file || !listId) {
      return NextResponse.json(
        { error: "file und list_id sind erforderlich" },
        { status: 400 }
      );
    }

    // Read file and prepare for OpenRouter
    const buffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();
    const mimeType = file.type;

    let content: Array<{ type: string; [key: string]: any }>;

    // Handle different file types
    if (mimeType.startsWith("image/")) {
      // Image: use base64 + vision
      const base64 = Buffer.from(buffer).toString("base64");
      content = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data: base64,
          },
        },
        {
          type: "text",
          text: 'Analysiere dieses Bild und extrahiere alle Einkaufsartikel oder Zutaten, die darin erwähnt oder sichtbar sind. Antworte NUR mit einem JSON-Array von Strings, z.B. ["Milch", "Äpfel", "Brot"]. Keine Erklärungen, kein Markdown – nur das JSON-Array.',
        },
      ];
    } else if (
      mimeType === "application/pdf" ||
      fileName.endsWith(".pdf")
    ) {
      // PDF: use base64
      const base64 = Buffer.from(buffer).toString("base64");
      content = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        },
        {
          type: "text",
          text: 'Analysiere dieses PDF und extrahiere alle Einkaufsartikel oder Zutaten. Antworte NUR mit einem JSON-Array von Strings, z.B. ["Milch", "Äpfel", "Brot"]. Keine Erklärungen, kein Markdown – nur das JSON-Array.',
        },
      ];
    } else {
      // Text file: decode as string
      const text = Buffer.from(buffer).toString("utf-8");
      content = [
        {
          type: "text",
          text: text
            ? `Analysiere diesen Text und extrahiere alle Einkaufsartikel oder Zutaten:\n\n${text}\n\nAntworte NUR mit einem JSON-Array von Strings, z.B. ["Milch", "Äpfel", "Brot"]. Keine Erklärungen, kein Markdown – nur das JSON-Array.`
            : "Antworte mit einem leeren JSON-Array: []",
        },
      ];
    }

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Shopping List Upload",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: content,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          `OpenRouter error: ${response.status}`
      );
    }

    // Extract text response
    const responseText = data.content?.[0]?.text || "";

    // Parse JSON array
    let items: string[] = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      }
    } catch {
      items = [];
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { items: [], message: "Keine Artikel gefunden" },
        { status: 200 }
      );
    }

    // Get Supabase client and fetch max order_index
    const supabase = createServerClient();
    const { data: maxRow } = await supabase
      .from("items")
      .select("order_index")
      .eq("list_id", listId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    let baseOrderIndex = (maxRow?.order_index ?? 0) + 1000;

    // Build bulk insert array with auto-detected categories
    const itemsToInsert = items
      .map((text, index) => ({
        list_id: listId,
        text: text.trim(),
        category: detectCategory(text),
        checked: false,
        order_index: baseOrderIndex + index * 1000,
      }))
      .filter((item) => item.text.length > 0);

    if (itemsToInsert.length === 0) {
      return NextResponse.json(
        { items: [], message: "Keine gültigen Artikel gefunden" },
        { status: 200 }
      );
    }

    // Bulk insert
    const { data: insertedItems, error } = await supabase
      .from("items")
      .insert(itemsToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ items: insertedItems || [] }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
