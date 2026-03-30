import { createServerClient } from "@/lib/supabase/server";
import AdminListsClient from "@/components/AdminListsClient";

interface List {
  id: string;
  name: string;
  created_at: string;
  item_count: number;
}

export default async function AdminPage() {
  const supabase = createServerClient();

  // Fetch all lists with item count
  const { data: lists, error } = await supabase
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

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="heading text-3xl font-normal" style={{ color: "var(--text-primary)" }}>
          Admin
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Fehler beim Laden der Listen: {error.message}</p>
      </div>
    );
  }

  const transformedLists: List[] = (lists || []).map((list: any) => ({
    id: list.id,
    name: list.name,
    created_at: list.created_at,
    item_count: list.items?.[0]?.count ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="heading text-3xl font-normal" style={{ color: "var(--text-primary)" }}>
          Admin — Listen verwalten
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          {transformedLists.length} Liste{transformedLists.length !== 1 ? "n" : ""} insgesamt
        </p>
      </div>

      <AdminListsClient initialLists={transformedLists} />
    </div>
  );
}
