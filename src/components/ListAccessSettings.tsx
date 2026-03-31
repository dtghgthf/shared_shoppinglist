"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Globe, Link2, Lock, Users } from "lucide-react";
import {
  ListVisibility,
  ListMember,
  ListWithAccess,
  getListAccess,
  getListMembersWithEmails,
  updateListVisibility,
} from "@/lib/list/actions";
import ListMembers from "./ListMembers";

interface Props {
  listId: string;
  currentUserId: string | null;
  onVisibilityChange?: (visibility: ListVisibility) => void;
}

const VISIBILITY_OPTIONS: {
  value: ListVisibility;
  label: string;
  description: string;
  icon: typeof Lock;
}[] = [
  {
    value: "private",
    label: "Privat",
    description: "Nur du und eingeladene Mitglieder",
    icon: Lock,
  },
  {
    value: "link_read",
    label: "Link zum Lesen",
    description: "Jeder mit dem Link kann ansehen",
    icon: Globe,
  },
  {
    value: "link_write",
    label: "Link zum Bearbeiten",
    description: "Jeder mit dem Link kann bearbeiten",
    icon: Link2,
  },
];

export default function ListAccessSettings({
  listId,
  currentUserId,
  onVisibilityChange,
}: Props) {
  const [listAccess, setListAccess] = useState<ListWithAccess | null>(null);
  const [members, setMembers] = useState<ListMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [access, memberList] = await Promise.all([
        getListAccess(listId),
        getListMembersWithEmails(listId),
      ]);

      console.log("[ListAccessSettings] Data loaded:", { access, memberList });
      setListAccess(access);
      setMembers(memberList);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fehler beim Laden";
      console.error("[ListAccessSettings] Error:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleVisibilityChange(visibility: ListVisibility) {
    if (!listAccess?.isOwner) return;

    setUpdating(true);
    setError(null);

    const result = await updateListVisibility(listId, visibility);

    if (!result.success) {
      setError(result.error || "Fehler beim Aktualisieren");
    } else {
      setListAccess((prev) => (prev ? { ...prev, visibility } : null));
      onVisibilityChange?.(visibility);
    }

    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div
          className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border-subtle)",
            borderTopColor: "var(--accent)",
          }}
        />
      </div>
    );
  }

  if (!listAccess) {
    return (
      <div
        className="text-sm text-center py-4"
        style={{ color: "var(--text-secondary)" }}
      >
        Zugriff nicht möglich
      </div>
    );
  }

  const isOwner = listAccess.isOwner;
  const isUnclaimed = !listAccess.owner_id;

  return (
    <div className="flex flex-col gap-6">
      {/* Error message */}
      {error && (
        <div
          className="text-xs px-3 py-2 rounded-[4px]"
          style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}
        >
          {error}
        </div>
      )}

      {/* Unclaimed notice */}
      {isUnclaimed && (
        <div
          className="flex items-start gap-3 px-3 py-3 rounded-[4px]"
          style={{ backgroundColor: "var(--item-drag)" }}
        >
          <Shield
            size={18}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "var(--accent)" }}
          />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Öffentliche Liste
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Diese Liste hat keinen Besitzer. Jeder mit dem Link kann sie bearbeiten.
            </p>
          </div>
        </div>
      )}

      {/* Visibility settings - only for owner */}
      {isOwner && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "var(--text-secondary)" }} />
            <h4
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Sichtbarkeit
            </h4>
          </div>

          <div className="flex flex-col gap-2">
            {VISIBILITY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = listAccess.visibility === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleVisibilityChange(option.value)}
                  disabled={updating}
                  className="flex items-start gap-3 px-3 py-3 rounded-[4px] border text-left transition-all duration-150"
                  style={{
                    borderColor: isSelected ? "var(--accent)" : "var(--border-subtle)",
                    backgroundColor: isSelected ? "var(--item-drag)" : "var(--bg)",
                    opacity: updating ? 0.5 : 1,
                  }}
                >
                  <Icon
                    size={18}
                    className="flex-shrink-0 mt-0.5"
                    style={{
                      color: isSelected ? "var(--accent)" : "var(--border-strong)",
                    }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isSelected
                          ? "var(--accent)"
                          : "var(--text-primary)",
                      }}
                    >
                      {option.label}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {option.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Not owner - show current visibility */}
      {!isOwner && !isUnclaimed && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "var(--text-secondary)" }} />
            <h4
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Sichtbarkeit
            </h4>
          </div>
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-[4px]"
            style={{ backgroundColor: "var(--bg)" }}
          >
            {(() => {
              const option = VISIBILITY_OPTIONS.find(
                (o) => o.value === listAccess.visibility
              );
              const Icon = option?.icon || Lock;
              return (
                <>
                  <Icon
                    size={18}
                    className="flex-shrink-0"
                    style={{ color: "var(--border-strong)" }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {option?.label || "Unbekannt"}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {option?.description || ""}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Members section - only show if there's an owner */}
      {!isUnclaimed && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "var(--text-secondary)" }} />
            <h4
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Mitglieder
            </h4>
          </div>

          <ListMembers
            listId={listId}
            members={members}
            ownerId={listAccess.owner_id}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onMembersChange={loadData}
          />
        </div>
      )}
    </div>
  );
}
