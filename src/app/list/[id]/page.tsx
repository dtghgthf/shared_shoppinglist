import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Item } from "@/lib/types";
import EditableListName from "@/components/EditableListName";
import QrCodeDisplay from "@/components/QrCodeDisplay";
import AddItemForm from "@/components/AddItemForm";
import UploadItemsForm from "@/components/UploadItemsForm";
import ShoppingList from "@/components/ShoppingList";
import HistoryTracker from "@/components/HistoryTracker";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single();

  if (!list) notFound();

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("list_id", id)
    .order("order_index", { ascending: true });

  const listUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/list/${id}`;

  return (
    <div>
      <HistoryTracker listId={id} listName={list.name} />
      <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "var(--border-strong)" }}
        >
          ← Zurück
        </Link>
        <EditableListName listId={id} initialName={list.name} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
          Artikel hinzufügen
        </h2>
        <AddItemForm listId={id} />
        <UploadItemsForm listId={id} />
      </div>

      <div className="h-px" style={{ backgroundColor: "var(--border-subtle)" }} />

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
          Einkaufsliste
        </h2>
        <ShoppingList listId={id} initialItems={(items as Item[]) || []} />
      </div>

      <div className="h-px" style={{ backgroundColor: "var(--border-subtle)" }} />

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
          Mit Freunden teilen
        </h2>
        <QrCodeDisplay url={listUrl} />
      </div>
      </div>
    </div>
  );
}
