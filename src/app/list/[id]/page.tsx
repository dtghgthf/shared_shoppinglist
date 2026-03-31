import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Item } from "@/lib/types";
import EditableListName from "@/components/EditableListName";
import ListPageClient from "@/components/ListPageClient";
import HistoryTracker from "@/components/HistoryTracker";
import ListPageWrapper from "@/components/ListPageWrapper";

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
    <ListPageWrapper listId={id} listName={list.name} listUrl={listUrl}>
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
        <ListPageClient listId={id} initialItems={(items as Item[]) || []} />
      </div>
    </ListPageWrapper>
  );
}
