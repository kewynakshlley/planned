import { NextRequest, NextResponse } from "next/server";
import { createRoom, toRoomView } from "@/lib/room";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name : "Planning Poker";
  const roundName = typeof body?.roundName === "string" ? body.roundName : "";

  const room = await createRoom(name, roundName);

  return NextResponse.json({ room: toRoomView(room) }, { status: 201 });
}
