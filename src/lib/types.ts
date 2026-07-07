export const VOTE_VALUES = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "34",
  "55",
  "89",
  "?",
  "☕",
] as const;

export type VoteValue = (typeof VOTE_VALUES)[number];

export type Participant = {
  id: string;
  name: string;
  vote: VoteValue | null;
  isSpectator: boolean;
  joinedAt: number;
  lastSeen: number;
};

export type Room = {
  id: string;
  name: string;
  roundName: string;
  createdAt: number;
  revealed: boolean;
  participants: Record<string, Participant>;
};

export type ParticipantView = Omit<Participant, "vote"> & {
  vote: VoteValue | null;
  hasVoted: boolean;
};

export type RoomView = Omit<Room, "participants"> & {
  participants: ParticipantView[];
};
