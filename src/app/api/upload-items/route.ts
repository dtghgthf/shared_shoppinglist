import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { detectCategory } from "@/lib/categories";
import { UploadDebugger } from "@/lib/uploadDebugger";

export async function POST(request: Request) {
  const startTime = Date.now();
  const debugLog = new UploadDebugger();
  
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

    // Fetch current list items first (ALL items, including checked ones)
    const supabase = createServerClient();
    const { data: currentItems, error: fetchError } = await supabase
      .from("items")
      .select("id, text, checked")
      .eq("list_id", listId)
      .order("order_index", { ascending: true });

    if (fetchError) throw fetchError;

    const existingList = (currentItems || []).map((item) => ({
      id: item.id,
      text: item.text,
      checked: item.checked,
    }));

    // Read file and prepare for OpenRouter
    const buffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();
    const mimeType = file.type;
    const fileSize = buffer.byteLength;

    let content: Array<{ type: string; [key: string]: any }>;

    const existingItemsText =
      existingList.length > 0
        ? `\n\nAKTUELLE LISTE:\n${existingList.map((item) => `- ID:${item.id} | ${item.text}${item.checked ? " (✓ abgehakt)" : ""}`).join("\n")}`
        : "\n\nAKTUELLE LISTE: (leer)";

    const mergeInstructions = `
Du bist ein Shopping-List-Experte. Analysiere die hochgeladene Datei und vergleiche mit der aktuellen Liste.

WICHTIGE MERGE-REGELN:
1. ERKENNE DUPLIKATE sehr großzügig: "Milch" = "Vollmilch" = "1L Milch" = "Milch 3,5%"
2. ERHÖHE MENGE bei Duplikaten: "Milch" + "Milch" → "2x Milch"
3. AUCH ABGEHAKTE berücksichtigen: Wenn Duplikat abgehakt ist, erhöhe trotzdem Menge
4. FORMAT: Immer "Nx" Präfix (z.B. "2x Bananen", NIE "Bananen x2")
5. STRIP alte Mengen: "2x Milch" + "Milch" → "3x Milch" (nicht "3x 2x Milch")

AUSGABE: Striktes JSON-Format:
{
  "new": ["Artikel1", "Artikel2"],
  "updates": [
    {"id": "uuid-hier", "text": "2x Milch"},
    {"id": "uuid-hier", "text": "3x Käse"}
  ]
}

- "new": Nur komplett NEUE Artikel (die nicht mit existierenden matchen)
- "updates": Artikel die mit existierenden zusammengeführt werden (IMMER mit korrekter ID aus aktueller Liste!)${existingItemsText}

NEUE ARTIKEL AUS DATEI (jetzt analysieren!):`;

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
          text: mergeInstructions,
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
          text: mergeInstructions,
        },
      ];
    } else {
      // Text file: decode as string
      const text = Buffer.from(buffer).toString("utf-8");
      content = [
        {
          type: "text",
          text: text
            ? `${mergeInstructions}\n\n${text}`
            : "Antworte mit: {\"new\": [], \"updates\": []}",
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
        "OpenRouter-Cache": "false",  // Disable caching explicitly
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: 2048,
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

    // Parse JSON response with new/updates structure
    let result: { new: string[]; updates: Array<{ id: string; text: string }> } = {
      new: [],
      updates: [],
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: try old format (simple array)
      try {
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          result.new = JSON.parse(arrayMatch[0]);
        }
      } catch {
        result = { new: [], updates: [] };
      }
    }

    const newItems = Array.isArray(result.new) ? result.new : [];
    const updates = Array.isArray(result.updates) ? result.updates : [];

    if (newItems.length === 0 && updates.length === 0) {
      // Log debug info
      await debugLog.logUpload({
        timestamp: new Date().toISOString(),
        listId,
        fileName: file.name,
        fileType: mimeType,
        fileSize,
        existingItems: existingList,
        aiPrompt: mergeInstructions,
        aiResponse: responseText,
        parsedResult: result,
        finalResult: {
          newItemsCount: 0,
          updatesCount: 0,
          message: "Keine Artikel gefunden",
        },
        durationMs: Date.now() - startTime,
      });

      return NextResponse.json(
        { items: [], message: "Keine Artikel gefunden" },
        { status: 200 }
      );
    }

    // Process updates first (merge with existing items)
    const updatedCount = updates.length;
    for (const update of updates) {
      if (update.id && update.text) {
        // Update text AND uncheck if it was checked
        await supabase
          .from("items")
          .update({ 
            text: update.text.trim(),
            checked: false  // Always uncheck when merging
          })
          .eq("id", update.id)
          .eq("list_id", listId);
      }
    }

    // Process new items
    if (newItems.length === 0) {
      return NextResponse.json(
        {
          items: [],
          message: `${updatedCount} Artikel aktualisiert`,
        },
        { status: 200 }
      );
    }

    // Get max order_index for new items
    const { data: maxRow } = await supabase
      .from("items")
      .select("order_index")
      .eq("list_id", listId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    let baseOrderIndex = (maxRow?.order_index ?? 0) + 1000;

    // Build bulk insert array with auto-detected categories
    const itemsToInsert = newItems
      .map((text, index) => ({
        list_id: listId,
        text: text.trim(),
        category: detectCategory(text),
        checked: false,
        order_index: baseOrderIndex + index * 1000,
      }))
      .filter((item) => item.text.length > 0);

    if (itemsToInsert.length === 0 && updatedCount === 0) {
      return NextResponse.json(
        { items: [], message: "Keine gültigen Artikel gefunden" },
        { status: 200 }
      );
    }

    // Bulk insert new items
    let insertedItems = [];
    if (itemsToInsert.length > 0) {
      const { data, error } = await supabase
        .from("items")
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      insertedItems = data || [];
    }

    const summary =
      updatedCount > 0 && insertedItems.length > 0
        ? `${insertedItems.length} neu, ${updatedCount} zusammengeführt`
        : updatedCount > 0
        ? `${updatedCount} Artikel zusammengeführt`
        : `${insertedItems.length} Artikel hinzugefügt`;

    // Log successful upload
    await debugLog.logUpload({
      timestamp: new Date().toISOString(),
      listId,
      fileName: file.name,
      fileType: mimeType,
      fileSize,
      existingItems: existingList,
      aiPrompt: mergeInstructions,
      aiResponse: responseText,
      parsedResult: result,
      finalResult: {
        newItemsCount: insertedItems.length,
        updatesCount: updatedCount,
        message: summary,
      },
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json(
      { items: insertedItems, message: summary },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Upload error:", message);
    
    // Log error
    try {
      const debugLog2 = new UploadDebugger();
      await debugLog2.logError(
        "unknown",
        err as Error,
        {
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startTime,
        }
      );
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
