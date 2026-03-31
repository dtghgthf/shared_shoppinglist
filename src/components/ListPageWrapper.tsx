"use client";

import { useEffect } from "react";

interface Props {
  listId: string;
  listName: string;
  listUrl: string;
  children: React.ReactNode;
}

export default function ListPageWrapper({ listId, listName, listUrl, children }: Props) {
  useEffect(() => {
    // Set the toolbar data in a global variable that GlobalToolbar can access
    (window as any).__listToolbarData = { listId, listName, listUrl };
    
    return () => {
      (window as any).__listToolbarData = null;
    };
  }, [listId, listName, listUrl]);

  return <div>{children}</div>;
}
