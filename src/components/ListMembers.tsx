"use client";

import { useState } from "react";
import { Users, Crown, Edit3, Eye, X, LogOut } from "lucide-react";
import {
  ListMember,
  MemberRole,
  removeListMember,
  updateMemberRole,
  leaveList,
} from "@/lib/list/actions";

interface Props {
  listId: string;
  members: ListMember[];
  ownerId: string | null;
  currentUserId: string | null;
  isOwner: boolean;
  onMembersChange: () => void;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Besitzer",
  editor: "Bearbeiter",
  viewer: "Betrachter",
};

const ROLE_ICONS: Record<MemberRole, typeof Crown> = {
  owner: Crown,
  editor: Edit3,
  viewer: Eye,
};

export default function ListMembers({
  listId,
  members,
  ownerId: _ownerId,
  currentUserId,
  isOwner,
  onMembersChange,
}: Props) {
  // _ownerId is available for future use (e.g., owner badge display)
  void _ownerId;
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: MemberRole) {
    setLoading(userId);
    setError(null);

    const result = await updateMemberRole(listId, userId, newRole);

    if (!result.success) {
      setError(result.error || "Fehler beim Ändern der Rolle");
    } else {
      onMembersChange();
    }

    setLoading(null);
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Mitglied wirklich entfernen?")) return;

    setLoading(userId);
    setError(null);

    const result = await removeListMember(listId, userId);

    if (!result.success) {
      setError(result.error || "Fehler beim Entfernen");
    } else {
      onMembersChange();
    }

    setLoading(null);
  }

  async function handleLeave() {
    if (!confirm("Liste wirklich verlassen?")) return;

    setLoading("self");
    setError(null);

    const result = await leaveList(listId);

    if (!result.success) {
      setError(result.error || "Fehler beim Verlassen");
    } else {
      onMembersChange();
      window.location.href = "/";
    }

    setLoading(null);
  }

  function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <Users size={24} style={{ color: "var(--border-strong)" }} />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Noch keine Mitglieder eingeladen
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div
          className="text-xs px-3 py-2 rounded-[4px]"
          style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}
        >
          {error}
        </div>
      )}

      <ul className="flex flex-col gap-1">
        {members.map((member) => {
          const RoleIcon = ROLE_ICONS[member.role];
          const isSelf = member.user_id === currentUserId;
          const isLoading = loading === member.user_id || (isSelf && loading === "self");

          return (
            <li
              key={member.user_id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[4px] transition-colors"
              style={{ backgroundColor: "var(--bg)" }}
            >
              {/* Avatar */}
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                >
                  {getInitials(member.display_name)}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {member.display_name || member.user_id.substring(0, 8)}
                  {isSelf && (
                    <span
                      className="ml-1.5 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      (Du)
                    </span>
                  )}
                </p>
              </div>

              {/* Role badge or selector */}
              {isOwner && !isSelf ? (
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.user_id, e.target.value as MemberRole)
                  }
                  disabled={isLoading}
                  className="text-xs px-2 py-1 rounded-[4px] border appearance-none cursor-pointer"
                  style={{
                    borderColor: "var(--border-subtle)",
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  <option value="viewer">Betrachter</option>
                  <option value="editor">Bearbeiter</option>
                </select>
              ) : (
                <span
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-[4px]"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <RoleIcon size={12} />
                  {ROLE_LABELS[member.role]}
                </span>
              )}

              {/* Remove / Leave button */}
              {isOwner && !isSelf && (
                <button
                  onClick={() => handleRemoveMember(member.user_id)}
                  disabled={isLoading}
                  className="p-1.5 rounded-[4px] transition-opacity hover:opacity-70"
                  style={{
                    color: "var(--border-strong)",
                    opacity: isLoading ? 0.3 : 1,
                  }}
                  title="Mitglied entfernen"
                >
                  <X size={14} />
                </button>
              )}

              {isSelf && !isOwner && (
                <button
                  onClick={handleLeave}
                  disabled={isLoading}
                  className="p-1.5 rounded-[4px] transition-opacity hover:opacity-70"
                  style={{
                    color: "var(--border-strong)",
                    opacity: isLoading ? 0.3 : 1,
                  }}
                  title="Liste verlassen"
                >
                  <LogOut size={14} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
