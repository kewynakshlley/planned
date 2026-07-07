import { customAlphabet } from "nanoid";
import { getRedis } from "./redis";
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

const ROOM_TTL_SECONDS = 60 * 60 * 24; // 24h

type RoomMeta = {
  id: string;
  name: string;
  roundName: string;
  createdAt: number;
  revealed: boolean;
};

function metaKey(roomId: string): string {
  return `room:${roomId}:meta`;
}

function participantsKey(roomId: string): string {
  return `room:${roomId}:participants`;
}

async function getMeta(roomId: string): Promise<RoomMeta | null> {
  const redis = getRedis();
  const meta = await redis.get<RoomMeta>(metaKey(roomId));
  return meta ?? null;
}

async function saveMeta(meta: RoomMeta): Promise<void> {
  const redis = getRedis();
  await redis.set(metaKey(meta.id), meta, { ex: ROOM_TTL_SECONDS });
}

async function getParticipants(
  roomId: string
): Promise<Record<string, Participant>> {
  const redis = getRedis();
  const raw = await redis.hgetall<Record<string, string>>(
    participantsKey(roomId)
  );
  const participants: Record<string, Participant> = {};
  if (!raw) return participants;

  for (const [id, value] of Object.entries(raw)) {
    try {
      participants[id] =
        typeof value === "string" ? JSON.parse(value) : (value as Participant);
    } catch {
      // skip corrupt entries
    }
  }
  return participants;
}

async function saveParticipant(
  roomId: string,
  participant: Participant
): Promise<void> {
  const redis = getRedis();
  await redis.hset(participantsKey(roomId), {
    [participant.id]: JSON.stringify(participant),
  });
  await redis.expire(participantsKey(roomId), ROOM_TTL_SECONDS);
}

async function getParticipant(
  roomId: string,
  participantId: string
): Promise<Participant | null> {
  const redis = getRedis();
  const raw = await redis.hget<string>(participantsKey(roomId), participantId);
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : (raw as Participant);
  } catch {
    return null;
  }
}

async function buildRoom(meta: RoomMeta): Promise<Room> {
  const participants = await getParticipants(meta.id);
  return {
    id: meta.id,
    name: meta.name,
    roundName: meta.roundName,
    createdAt: meta.createdAt,
    revealed: meta.revealed,
    participants,
  };
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const meta = await getMeta(roomId);
  if (!meta) return null;
  return buildRoom(meta);
}

export async function createRoom(
  name: string,
  roundName?: string
): Promise<Room> {
  const redis = getRedis();
  let id = generateRoomId();

  while (await redis.exists(metaKey(id))) {
    id = generateRoomId();
  }

  const meta: RoomMeta = {
    id,
    name: name.trim() || "Planning Poker",
    roundName: roundName?.trim().slice(0, 120) ?? "",
    createdAt: Date.now(),
    revealed: false,
  };

  await saveMeta(meta);
  return { ...meta, participants: {} };
}

export async function joinRoom(
  roomId: string,
  name: string,
  isSpectator: boolean
): Promise<{ room: Room; participantId: string } | null> {
  const meta = await getMeta(roomId);
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

  await saveParticipant(roomId, participant);
  await redisExpireMeta(roomId);

  const room = await buildRoom(meta);
  return { room, participantId };
}

async function redisExpireMeta(roomId: string): Promise<void> {
  const redis = getRedis();
  await redis.expire(metaKey(roomId), ROOM_TTL_SECONDS);
}

export async function touchParticipant(
  roomId: string,
  participantId: string
): Promise<Room | null> {
  const meta = await getMeta(roomId);
  if (!meta) return null;

  const participant = await getParticipant(roomId, participantId);
  if (!participant) return null;

  participant.lastSeen = Date.now();
  await saveParticipant(roomId, participant);

  return buildRoom(meta);
}

export async function castVote(
  roomId: string,
  participantId: string,
  vote: VoteValue | null
): Promise<Room | null> {
  const meta = await getMeta(roomId);
  if (!meta) return null;

  const participant = await getParticipant(roomId, participantId);
  if (!participant) return null;

  if (vote !== null && !VOTE_VALUES.includes(vote)) {
    throw new Error("Invalid vote value");
  }

  participant.vote = vote;
  participant.lastSeen = Date.now();
  await saveParticipant(roomId, participant);

  return buildRoom(meta);
}

export async function revealVotes(roomId: string): Promise<Room | null> {
  const meta = await getMeta(roomId);
  if (!meta) return null;

  meta.revealed = true;
  await saveMeta(meta);

  return buildRoom(meta);
}

export async function setRoundName(
  roomId: string,
  roundName: string
): Promise<Room | null> {
  const meta = await getMeta(roomId);
  if (!meta) return null;

  meta.roundName = roundName.trim().slice(0, 120);
  await saveMeta(meta);

  return buildRoom(meta);
}

export async function resetRound(
  roomId: string,
  roundName?: string
): Promise<Room | null> {
  const meta = await getMeta(roomId);
  if (!meta) return null;

  meta.revealed = false;
  if (roundName !== undefined) {
    meta.roundName = roundName.trim().slice(0, 120);
  }
  await saveMeta(meta);

  const participants = await getParticipants(roomId);
  await Promise.all(
    Object.values(participants).map((participant) =>
      saveParticipant(roomId, { ...participant, vote: null })
    )
  );

  return buildRoom(meta);
}

export async function leaveRoom(
  roomId: string,
  participantId: string
): Promise<Room | null> {
  const meta = await getMeta(roomId);
  if (!meta) return null;

  const redis = getRedis();
  await redis.hdel(participantsKey(roomId), participantId);

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
