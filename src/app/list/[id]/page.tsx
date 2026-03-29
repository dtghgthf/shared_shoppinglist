import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Item } from "@/lib/types";
import QrCodeDisplay from "@/components/QrCodeDisplay";
import AddItemForm from "@/components/AddItemForm";
import ShoppingList from "@/components/ShoppingList";

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
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "var(--border-strong)" }}
        >
          ← Zurück
        </Link>
        <h1 className="heading text-4xl font-normal" style={{ color: "var(--text-primary)" }}>
          {list.name}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
          Artikel hinzufügen
        </h2>
        <AddItemForm listId={id} />
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
  );
}
