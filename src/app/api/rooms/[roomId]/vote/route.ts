import { NextRequest, NextResponse } from "next/server";
import { castVote, toRoomView } from "@/lib/room";
import type { VoteValue } from "@/lib/types";

type Params = { params: { roomId: string } };

export async function POST(request: NextRequest, { params }: Params) {
  const { roomId } = params;
  const body = await request.json().catch(() => ({}));
  const participantId =
    typeof body?.participantId === "string" ? body.participantId : "";
  const vote: VoteValue | null = body?.vote ?? null;

  if (!participantId) {
    return NextResponse.json(
      { error: "participantId is required" },
      { status: 400 }
    );
  }

  let room;
  try {
    room = await castVote(roomId, participantId, vote);
  } catch {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  if (!room) {
    return NextResponse.json(
      { error: "Room or participant not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ room: toRoomView(room, participantId) });
}
