"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomView } from "@/lib/types";

const POLL_INTERVAL_MS = 1500;

type UseRoomPollingResult = {
  room: RoomView | null;
  loading: boolean;
  notFound: boolean;
  refresh: () => Promise<void>;
};

export function useRoomPolling(
  roomId: string,
  participantId: string | null
): UseRoomPollingResult {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const participantIdRef = useRef(participantId);
  useEffect(() => {
    participantIdRef.current = participantId;
  }, [participantId]);

  const fetchRoom = useCallback(async () => {
    const query = participantIdRef.current
      ? `?participantId=${encodeURIComponent(participantIdRef.current)}`
      : "";
    try {
      const res = await fetch(`/api/rooms/${roomId}${query}`, {
        cache: "no-store",
      });
      if (res.status === 404) {
        setNotFound(true);
        setRoom(null);
        return;
      }
      const data = await res.json();
      setRoom(data.room as RoomView);
      setNotFound(false);
    } catch {
      // transient network error, keep last known state
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchRoom]);

  return { room, loading, notFound, refresh: fetchRoom };
}
