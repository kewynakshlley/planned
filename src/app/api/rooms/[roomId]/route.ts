import { NextRequest, NextResponse } from "next/server";
import { getRoom, toRoomView, touchParticipant } from "@/lib/room";

type Params = { params: { roomId: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const { roomId } = params;
  const participantId = request.nextUrl.searchParams.get("participantId");

  const room = participantId
    ? await touchParticipant(roomId, participantId)
    : await getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room: toRoomView(room, participantId) });
}
