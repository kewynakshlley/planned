import { customAlphabet } from "nanoid";
import type {
  Participant,
  ParticipantView,
  Room,
  RoomView,
  VoteValue,
} from "./types";
import { VOTE_VALUES } from "./types";

const ROOM_ID_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const generateRoomId = customAlphabet(ROOM_ID_ALPHABET, 6);
const generateParticipantId = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  16
);

const ROOM_TTL_MS = 60 * 60 * 24 * 1000; // 24h

type RoomMeta = {
  id: string;
  name: string;
  roundName: string;
  createdAt: number;
  revealed: boolean;
  expiresAt: number;
  participants: Record<string, Participant>;
};

const rooms = new Map<string, RoomMeta>();

function getMeta(roomId: string): RoomMeta | null {
  const meta = rooms.get(roomId);
  if (!meta) return null;
  if (meta.expiresAt < Date.now()) {
    rooms.delete(roomId);
    return null;
  }
  return meta;
}

function touchExpiry(meta: RoomMeta): void {
  meta.expiresAt = Date.now() + ROOM_TTL_MS;
}

function buildRoom(meta: RoomMeta): Room {
  return {
    id: meta.id,
    name: meta.name,
    roundName: meta.roundName,
    createdAt: meta.createdAt,
    revealed: meta.revealed,
    participants: meta.participants,
  };
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const meta = getMeta(roomId);
  if (!meta) return null;
  return buildRoom(meta);
}

export async function createRoom(
  name: string,
  roundName?: string
): Promise<Room> {
  let id = generateRoomId();
  while (getMeta(id)) {
    id = generateRoomId();
  }

  const meta: RoomMeta = {
    id,
    name: name.trim() || "Planning Poker",
    roundName: roundName?.trim().slice(0, 120) ?? "",
    createdAt: Date.now(),
    revealed: false,
    expiresAt: Date.now() + ROOM_TTL_MS,
    participants: {},
  };

  rooms.set(id, meta);
  return buildRoom(meta);
}

export async function joinRoom(
  roomId: string,
  name: string,
  isSpectator: boolean
): Promise<{ room: Room; participantId: string } | null> {
  const meta = getMeta(roomId);
  if (!meta) return null;

  const participantId = generateParticipantId();
  const now = Date.now();
  const participant: Participant = {
    id: participantId,
    name: name.trim().slice(0, 40) || "Anonymous",
    vote: null,
    isSpectator,
    joinedAt: now,
    lastSeen: now,
  };

  meta.participants[participantId] = participant;
  touchExpiry(meta);

  return { room: buildRoom(meta), participantId };
}

export async function touchParticipant(
  roomId: string,
  participantId: string
): Promise<Room | null> {
  const meta = getMeta(roomId);
  if (!meta) return null;

  const participant = meta.participants[participantId];
  if (!participant) return null;

  participant.lastSeen = Date.now();
  touchExpiry(meta);

  return buildRoom(meta);
}

export async function castVote(
  roomId: string,
  participantId: string,
  vote: VoteValue | null
): Promise<Room | null> {
  const meta = getMeta(roomId);
  if (!meta) return null;

  const participant = meta.participants[participantId];
  if (!participant) return null;

  if (vote !== null && !VOTE_VALUES.includes(vote)) {
    throw new Error("Invalid vote value");
  }

  participant.vote = vote;
  participant.lastSeen = Date.now();
  touchExpiry(meta);

  return buildRoom(meta);
}

export async function revealVotes(roomId: string): Promise<Room | null> {
  const meta = getMeta(roomId);
  if (!meta) return null;

  meta.revealed = true;
  touchExpiry(meta);

  return buildRoom(meta);
}

export async function setRoundName(
  roomId: string,
  roundName: string
): Promise<Room | null> {
  const meta = getMeta(roomId);
  if (!meta) return null;

  meta.roundName = roundName.trim().slice(0, 120);
  touchExpiry(meta);

  return buildRoom(meta);
}

export async function resetRound(
  roomId: string,
  roundName?: string
): Promise<Room | null> {
  const meta = getMeta(roomId);
  if (!meta) return null;

  meta.revealed = false;
  if (roundName !== undefined) {
    meta.roundName = roundName.trim().slice(0, 120);
  }
  for (const participant of Object.values(meta.participants)) {
    participant.vote = null;
  }
  touchExpiry(meta);

  return buildRoom(meta);
}

export async function leaveRoom(
  roomId: string,
  participantId: string
): Promise<Room | null> {
  const meta = getMeta(roomId);
  if (!meta) return null;

  delete meta.participants[participantId];

  return buildRoom(meta);
}

export function toRoomView(room: Room, viewerId?: string | null): RoomView {
  const participants: ParticipantView[] = Object.values(room.participants)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((participant) => {
      const canSeeVote = room.revealed || participant.id === viewerId;
      return {
        ...participant,
        hasVoted: participant.vote !== null,
        vote: canSeeVote ? participant.vote : null,
      };
    });

  return {
    id: room.id,
    name: room.name,
    roundName: room.roundName,
    createdAt: room.createdAt,
    revealed: room.revealed,
    participants,
  };
}
