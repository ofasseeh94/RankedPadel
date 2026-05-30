import { NextRequest, NextResponse } from "next/server";
import { updateUserRole } from "@/lib/beta-store";
import type { BetaRole } from "@/types/beta";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    actorId?: string;
    adminCode?: string;
    targetUserId?: string;
    role?: BetaRole;
  };

  if (!body.actorId || !body.targetUserId || !body.role) {
    return NextResponse.json({ error: "Actor, target user, and role are required." }, { status: 400 });
  }

  const result = await updateUserRole({
    actorId: body.actorId,
    adminCode: body.adminCode,
    targetUserId: body.targetUserId,
    role: body.role,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ user: result.user });
}
