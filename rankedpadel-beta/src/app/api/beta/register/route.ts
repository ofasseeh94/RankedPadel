import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/beta-store";
import type { RegistrationAnswers } from "@/types/beta";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RegistrationAnswers;
  const result = await registerUser(body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ user: result.user });
}
