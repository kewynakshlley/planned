"use client";

import type { ParticipantView } from "@/lib/types";

type ParticipantListProps = {
  participants: ParticipantView[];
  revealed: boolean;
  currentParticipantId: string | null;
};

export function ParticipantList({
  participants,
  revealed,
  currentParticipantId,
}: ParticipantListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {participants.map((participant) => {
        const hasVoted = participant.hasVoted;
        const isMe = participant.id === currentParticipantId;

        return (
          <li
            key={participant.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {participant.name}
              {isMe && (
                <span className="text-xs font-normal text-zinc-400">
                  (you)
                </span>
              )}
              {participant.isSpectator && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-normal text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  spectator
                </span>
              )}
            </span>

            {!participant.isSpectator && (
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm font-semibold ${
                  revealed
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : hasVoted
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-zinc-200 bg-zinc-50 text-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600"
                }`}
              >
                {revealed ? participant.vote ?? "–" : hasVoted ? "✓" : ""}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
