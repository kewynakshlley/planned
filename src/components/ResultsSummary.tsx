"use client";

import type { ParticipantView } from "@/lib/types";

type ResultsSummaryProps = {
  participants: ParticipantView[];
};

export function ResultsSummary({ participants }: ResultsSummaryProps) {
  const voters = participants.filter((p) => !p.isSpectator && p.vote !== null);
  const numericVotes = voters
    .map((p) => Number(p.vote))
    .filter((n) => Number.isFinite(n));

  const average =
    numericVotes.length > 0
      ? numericVotes.reduce((sum, n) => sum + n, 0) / numericVotes.length
      : null;

  const allAgree =
    voters.length > 0 && voters.every((p) => p.vote === voters[0].vote);

  if (voters.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No votes were cast this round.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      {average !== null && (
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Average
          </p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {average.toFixed(1)}
          </p>
        </div>
      )}
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-400">Votes</p>
        <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {voters.length}
        </p>
      </div>
      {allAgree && (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Consensus reached 🎉
        </span>
      )}
    </div>
  );
}
