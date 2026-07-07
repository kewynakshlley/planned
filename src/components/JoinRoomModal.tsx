"use client";

import { useState } from "react";

type JoinRoomModalProps = {
  roomName: string;
  onJoin: (name: string, isSpectator: boolean) => Promise<void>;
};

export function JoinRoomModal({ roomName, onJoin }: JoinRoomModalProps) {
  const [name, setName] = useState("");
  const [isSpectator, setIsSpectator] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onJoin(name, isSpectator);
    } catch {
      setError("Could not join the room. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Join &ldquo;{roomName}&rdquo;
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter a display name to join the room.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />

          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={isSpectator}
              onChange={(e) => setIsSpectator(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Join as spectator (no voting)
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "Joining…" : "Join room"}
          </button>
        </form>
      </div>
    </div>
  );
}
