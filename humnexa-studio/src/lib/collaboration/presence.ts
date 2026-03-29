"use client";

import { supabase } from "@/lib/supabase/client";

export type CollaboratorPresence = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  color: string;
  cursor: { x: number; y: number };
  activeFile: string | null;
  typing: boolean;
  lastSeen: string;
};

type PresenceHandlers = {
  onSync: (users: CollaboratorPresence[]) => void;
};

const PRESENCE_COLORS = [
  "#f97316",
  "#22c55e",
  "#0ea5e9",
  "#a855f7",
  "#f43f5e",
  "#14b8a6",
  "#eab308",
];

export function colorForCollaborator(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}

export type ProjectPresenceController = {
  broadcast: (
    patch: Partial<
      Pick<CollaboratorPresence, "cursor" | "activeFile" | "typing" | "lastSeen">
    >,
  ) => Promise<void>;
  leave: () => Promise<void>;
};

export function createProjectPresence(
  projectId: string,
  currentUser: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  },
  handlers: PresenceHandlers,
): ProjectPresenceController {
  const channel = supabase.channel(`project-${projectId}`, {
    config: {
      presence: {
        key: currentUser.id,
      },
    },
  });

  const baseState: CollaboratorPresence = {
    userId: currentUser.id,
    name: currentUser.name || "Collaborator",
    avatarUrl: currentUser.avatarUrl ?? null,
    color: colorForCollaborator(currentUser.id),
    cursor: { x: 0, y: 0 },
    activeFile: null,
    typing: false,
    lastSeen: new Date().toISOString(),
  };

  let currentState = baseState;

  const syncUsers = (): void => {
    const presenceState = channel.presenceState<CollaboratorPresence>();
    const users = Object.values(presenceState)
      .flat()
      .map((entry) => ({
        ...entry,
        color: entry.color || colorForCollaborator(entry.userId),
      }));
    handlers.onSync(users);
  };

  channel
    .on("presence", { event: "sync" }, syncUsers)
    .on("presence", { event: "join" }, syncUsers)
    .on("presence", { event: "leave" }, syncUsers);

  void channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track(currentState);
    }
  });

  return {
    broadcast: async (patch) => {
      currentState = {
        ...currentState,
        ...patch,
        lastSeen: patch.lastSeen ?? new Date().toISOString(),
      };
      await channel.track(currentState);
    },
    leave: async () => {
      await supabase.removeChannel(channel);
    },
  };
}
