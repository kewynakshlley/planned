import { NextRequest, NextResponse } from "next/server";
import { revealVotes, toRoomView } from "@/lib/room";

type Params = { params: { roomId: string } };

export async function POST(_request: NextRequest, { params }: Params) {
  const { roomId } = params;
  const room = await revealVotes(roomId);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room: toRoomView(room) });
}
