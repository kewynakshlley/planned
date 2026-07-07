"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStoredIdentity } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roundName, setRoundName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const createRes = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName || "Planning Poker",
          roundName,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create room");
      const { room } = await createRes.json();

      const joinRes = await fetch(`/api/rooms/${room.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isSpectator: false }),
      });
      if (!joinRes.ok) throw new Error("Failed to join room");
      const { participantId } = await joinRes.json();

      setStoredIdentity(room.id, { participantId, name: name.trim() });
      router.push(`/room/${room.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Plannit Poker
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Free, no-login planning poker for agile teams. Create a room and
            share the link.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Your name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ada"
              maxLength={40}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Room name{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Sprint 42 planning"
              maxLength={60}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              First item to vote on{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              placeholder="e.g. US-123 Checkout redesign"
              maxLength={120}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={creating}
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {creating ? "Creating room…" : "Create room"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          No account needed. Rooms expire automatically after 24 hours of
          inactivity.
        </p>
      </div>
    </div>
  );
}
