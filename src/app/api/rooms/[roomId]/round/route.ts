import { NextRequest, NextResponse } from "next/server";
import { setRoundName, toRoomView } from "@/lib/room";

type Params = { params: { roomId: string } };

export async function POST(request: NextRequest, { params }: Params) {
  const { roomId } = params;
  const body = await request.json().catch(() => ({}));
  const roundName = typeof body?.roundName === "string" ? body.roundName : "";

  const room = await setRoundName(roomId, roundName);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ room: toRoomView(room) });
}
