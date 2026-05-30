import { NextRequest, NextResponse } from "next/server";
import { recordGame } from "@/lib/beta-store";
import type { GameInput } from "@/lib/beta-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GameInput;
  const result = await recordGame({
    ...body,
    scoreFor: Number(body.scoreFor),
    scoreAgainst: Number(body.scoreAgainst),
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ game: result.game, user: result.user });
}
