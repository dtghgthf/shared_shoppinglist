"use client";

import { useRef } from "react";
import { Item } from "@/lib/types";
import AddItemForm from "./AddItemForm";
import UploadItemsForm from "./UploadItemsForm";
import ShoppingList, { ShoppingListHandle } from "./ShoppingList";

interface Props {
  listId: string;
  initialItems: Item[];
}

export default function ListPageClient({ listId, initialItems }: Props) {
  const shoppingListRef = useRef<ShoppingListHandle>(null);

  function handleItemAdding(item: Item) {
    shoppingListRef.current?.addOptimisticItem(item);
  }

  function handleItemAdded(tempId: string, realItem: Item) {
    shoppingListRef.current?.replaceTemp(tempId, realItem);
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
          Artikel hinzufügen
        </h2>
        <AddItemForm
          listId={listId}
          onItemAdding={handleItemAdding}
          onItemAdded={handleItemAdded}
        />
        <UploadItemsForm listId={listId} />
      </div>

      <div className="h-px" style={{ backgroundColor: "var(--border-subtle)" }} />

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--border-strong)" }}>
          Einkaufsliste
        </h2>
        <ShoppingList
          ref={shoppingListRef}
          listId={listId}
          initialItems={initialItems}
        />
      </div>
    </>
  );
}
