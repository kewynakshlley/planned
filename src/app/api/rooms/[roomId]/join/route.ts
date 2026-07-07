import { NextRequest, NextResponse } from "next/server";
import { joinRoom, toRoomView } from "@/lib/room";

type Params = { params: { roomId: string } };

export async function POST(request: NextRequest, { params }: Params) {
  const { roomId } = params;
  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name : "";
  const isSpectator = Boolean(body?.isSpectator);

  if (!name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const result = await joinRoom(roomId, name, isSpectator);

  if (!result) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({
    room: toRoomView(result.room, result.participantId),
    participantId: result.participantId,
  });
}
