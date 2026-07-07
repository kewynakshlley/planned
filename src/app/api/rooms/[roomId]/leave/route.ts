import { NextRequest, NextResponse } from "next/server";
import { leaveRoom, toRoomView } from "@/lib/room";

type Params = { params: { roomId: string } };

export async function POST(request: NextRequest, { params }: Params) {
  const { roomId } = params;
  const body = await request.json().catch(() => ({}));
  const participantId =
    typeof body?.participantId === "string" ? body.participantId : "";

  if (!participantId) {
    return NextResponse.json(
      { error: "participantId is required" },
      { status: 400 }
    );
  }

  const room = await leaveRoom(roomId, participantId);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room: toRoomView(room, participantId) });
}
