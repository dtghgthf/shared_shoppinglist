"use client";

import { useEffect } from "react";

interface Props {
  listId: string;
  listName: string;
  listUrl: string;
  currentUserId?: string | null;
  isOwner?: boolean;
  isUnclaimed?: boolean;
  children: React.ReactNode;
}

export default function ListPageWrapper({
  listId,
  listName,
  listUrl,
  currentUserId = null,
  isOwner = false,
  isUnclaimed = false,
  children,
}: Props) {
  useEffect(() => {
    // Set the toolbar data in a global variable that GlobalToolbar can access
    (window as any).__listToolbarData = {
      listId,
      listName,
      listUrl,
      currentUserId,
      isOwner,
      isUnclaimed,
    };
    
    return () => {
      (window as any).__listToolbarData = null;
    };
  }, [listId, listName, listUrl, currentUserId, isOwner, isUnclaimed]);

  return <div>{children}</div>;
}
