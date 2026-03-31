import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Item, List } from "@/lib/types";
import EditableListName from "@/components/EditableListName";
import ListPageClient from "@/components/ListPageClient";
import ListPageWrapper from "@/components/ListPageWrapper";
import ClaimListButton from "@/components/ClaimListButton";
import { canViewList, getListRole, ListRole } from "@/lib/auth/check-access";
import { autoJoinList } from "@/lib/list/actions";

interface Props {
  params: Promise<{ id: string }>;
}

function getRoleLabel(role: ListRole): string | null {
  switch (role) {
    case "owner":
      return "Besitzer";
    case "editor":
      return "Bearbeiter";
    case "viewer":
      return "Betrachter";
    default:
      return null;
  }
}

export default async function ListPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

  // Check access
  const hasAccess = await canViewList(currentUserId, id);
  if (!hasAccess) {
    redirect("/?error=no_access");
  }

  // Auto-join list if user is logged in and list is link-accessible
  if (currentUserId) {
    await autoJoinList(id);
  }

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

  const typedList = list as List;
  const isOwner = currentUserId !== null && typedList.owner_id === currentUserId;
  const isUnclaimed = typedList.owner_id === null;
  const userRole = await getListRole(currentUserId, id);
  const roleLabel = getRoleLabel(userRole);

  return (
    <ListPageWrapper
      listId={id}
      listName={typedList.name}
      listUrl={listUrl}
      currentUserId={currentUserId}
      isOwner={isOwner}
      isUnclaimed={isUnclaimed}
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: "var(--border-strong)" }}
            >
              ← Zurück
            </Link>
            {roleLabel && (
              <span 
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ 
                  color: "var(--accent)", 
                  backgroundColor: "rgba(217, 119, 87, 0.1)"
                }}
              >
                {roleLabel}
              </span>
            )}
          </div>
          <EditableListName listId={id} initialName={typedList.name} />
        </div>

        {isUnclaimed && currentUserId && (
          <div 
            className="p-4 rounded-[8px] border"
            style={{ 
              borderColor: "var(--border-subtle)", 
              backgroundColor: "var(--bg-elevated)" 
            }}
          >
            <p 
              className="text-sm mb-3" 
              style={{ color: "var(--text-secondary)" }}
            >
              Diese Liste hat noch keinen Besitzer. Übernimm sie, um sie zu verwalten.
            </p>
            <ClaimListButton listId={id} />
          </div>
        )}

        <ListPageClient 
          listId={id} 
          initialItems={(items as Item[]) || []} 
          userRole={userRole}
          isOwner={isOwner}
        />
      </div>
    </ListPageWrapper>
  );
}
