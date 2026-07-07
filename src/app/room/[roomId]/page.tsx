"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoomPolling } from "@/hooks/useRoomPolling";
import {
  clearStoredIdentity,
  getStoredIdentity,
  setStoredIdentity,
} from "@/lib/storage";
import type { VoteValue } from "@/lib/types";
import { JoinRoomModal } from "@/components/JoinRoomModal";
import { VotingCards } from "@/components/VotingCards";
import { ParticipantList } from "@/components/ParticipantList";
import { ResultsSummary } from "@/components/ResultsSummary";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { RoundNameEditor } from "@/components/RoundNameEditor";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();

  const [participantId, setParticipantId] = useState<string | null>(
    () => getStoredIdentity(roomId)?.participantId ?? null
  );
  const [actionPending, setActionPending] = useState(false);
  const [nextRoundName, setNextRoundName] = useState("");

  const { room, loading, notFound, refresh } = useRoomPolling(
    roomId,
    participantId
  );

  const handleJoin = useCallback(
    async (name: string, isSpectator: boolean) => {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isSpectator }),
      });
      if (!res.ok) throw new Error("Failed to join");
      const data = await res.json();
      setStoredIdentity(roomId, {
        participantId: data.participantId,
        name: name.trim(),
      });
      setParticipantId(data.participantId);
      await refresh();
    },
    [roomId, refresh]
  );

  const handleVote = useCallback(
    async (vote: VoteValue) => {
      if (!participantId) return;
      const me = room?.participants.find((p) => p.id === participantId);
      const nextVote = me?.vote === vote ? null : vote;
      await fetch(`/api/rooms/${roomId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, vote: nextVote }),
      });
      await refresh();
    },
    [roomId, participantId, room, refresh]
  );

  const handleReveal = useCallback(async () => {
    setActionPending(true);
    await fetch(`/api/rooms/${roomId}/reveal`, { method: "POST" });
    await refresh();
    setActionPending(false);
  }, [roomId, refresh]);

  const handleReset = useCallback(
    async (roundName?: string) => {
      setActionPending(true);
      await fetch(`/api/rooms/${roomId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundName }),
      });
      setNextRoundName("");
      await refresh();
      setActionPending(false);
    },
    [roomId, refresh]
  );

  const handleSetRoundName = useCallback(
    async (name: string) => {
      await fetch(`/api/rooms/${roomId}/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundName: name }),
      });
      await refresh();
    },
    [roomId, refresh]
  );

  const handleLeave = useCallback(async () => {
    if (participantId) {
      await fetch(`/api/rooms/${roomId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
    }
    clearStoredIdentity(roomId);
    router.push("/");
  }, [roomId, participantId, router]);

  if (loading && !room && !notFound) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-400">
        Loading room…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          Room not found
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          This room may have expired or the link is incorrect.
        </p>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Go home
        </button>
      </div>
    );
  }

  if (!room) return null;

  const me = participantId
    ? room.participants.find((p) => p.id === participantId)
    : undefined;

  const needsJoin = !participantId || !me;
  const votedCount = room.participants.filter(
    (p) => !p.isSpectator && p.hasVoted
  ).length;
  const voterCount = room.participants.filter((p) => !p.isSpectator).length;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      {needsJoin && (
        <JoinRoomModal roomName={room.name} onJoin={handleJoin} />
      )}

      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {room.name}
            </h1>
            <p className="text-sm text-zinc-400">
              {votedCount}/{voterCount} voted
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CopyLinkButton />
            <button
              onClick={handleLeave}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {room.revealed ? "Results for" : "Now voting on"}
              </p>
              <div className="mt-1">
                {room.revealed ? (
                  <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {room.roundName || "Untitled round"}
                  </span>
                ) : (
                  <RoundNameEditor
                    roundName={room.roundName}
                    onSave={handleSetRoundName}
                  />
                )}
              </div>
            </div>

            {!room.revealed && (
              <button
                onClick={handleReveal}
                disabled={actionPending || votedCount === 0}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
              >
                Reveal votes
              </button>
            )}
          </div>

          {room.revealed && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleReset(nextRoundName);
              }}
              className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800"
            >
              <input
                type="text"
                value={nextRoundName}
                onChange={(e) => setNextRoundName(e.target.value)}
                placeholder="Next up (e.g. US-124 …)"
                maxLength={120}
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={actionPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
              >
                Start new round
              </button>
            </form>
          )}

          <div className="mt-6">
            {room.revealed ? (
              <ResultsSummary participants={room.participants} />
            ) : me && !me.isSpectator ? (
              <VotingCards
                selected={me.vote}
                disabled={needsJoin}
                onSelect={handleVote}
              />
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You are spectating this round.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Participants
          </h2>
          <ParticipantList
            participants={room.participants}
            revealed={room.revealed}
            currentParticipantId={participantId}
          />
        </section>
      </main>
    </div>
  );
}
