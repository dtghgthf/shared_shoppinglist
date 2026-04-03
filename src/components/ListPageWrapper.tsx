"use client";

import { useEffect } from "react";

interface ToolbarData {
  listId: string;
  listName: string;
  listUrl: string;
  currentUserId?: string | null;
  isOwner?: boolean;
  isUnclaimed?: boolean;
}

interface Props extends ToolbarData {
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
    (window as unknown as { __listToolbarData?: ToolbarData }).__listToolbarData = {
      listId,
      listName,
      listUrl,
      currentUserId,
      isOwner,
      isUnclaimed,
    };
    
    return () => {
      (window as unknown as { __listToolbarData?: ToolbarData }).__listToolbarData = undefined;
    };
  }, [listId, listName, listUrl, currentUserId, isOwner, isUnclaimed]);

  return <div>{children}</div>;
}
