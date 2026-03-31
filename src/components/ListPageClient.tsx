"use client";

import { useRef } from "react";
import { Item } from "@/lib/types";
import { ListRole } from "@/lib/auth/check-access";
import AddItemForm from "./AddItemForm";
import ShoppingList, { ShoppingListHandle } from "./ShoppingList";

interface Props {
  listId: string;
  initialItems: Item[];
  userRole?: ListRole | null;
  isOwner?: boolean;
}

export default function ListPageClient({ listId, initialItems, userRole, isOwner }: Props) {
  const shoppingListRef = useRef<ShoppingListHandle>(null);
  const canEdit = isOwner || userRole === "editor";

  function handleItemAdding(item: Item) {
    shoppingListRef.current?.addOptimisticItem(item);
  }

  function handleItemAdded(tempId: string, realItem: Item) {
    shoppingListRef.current?.replaceTemp(tempId, realItem);
  }

  return (
    <>
      {canEdit && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
            Artikel hinzufügen
          </h2>
          <AddItemForm
            listId={listId}
            onItemAdding={handleItemAdding}
            onItemAdded={handleItemAdded}
          />
        </div>
      )}

      {canEdit && <div className="h-px" style={{ backgroundColor: "var(--border-subtle)" }} />}

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
          Einkaufsliste
        </h2>
        <ShoppingList
          ref={shoppingListRef}
          listId={listId}
          initialItems={initialItems}
          canEdit={canEdit}
        />
      </div>
    </>
  );
}
