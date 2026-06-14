"use client";

import { Avatar } from "@/components/ui/avatar";

interface Viewer {
  userId: string;
  userName: string;
}

export function PresenceAvatars({ viewers }: { viewers: Viewer[] }) {
  if (viewers.length <= 1) return null;

  return (
    <div className="flex align-center gap-1" title={`${viewers.length} viewing`}>
      {viewers.slice(0, 5).map((v) => (
        <Avatar key={v.userId} name={v.userName} email="" size={24} />
      ))}
      {viewers.length > 5 && (
        <span className="text-xs text-muted">+{viewers.length - 5}</span>
      )}
    </div>
  );
}
