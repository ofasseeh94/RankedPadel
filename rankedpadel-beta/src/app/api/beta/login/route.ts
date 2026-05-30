import { NextRequest, NextResponse } from "next/server";
import { findUserByContact } from "@/lib/beta-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { contact?: string; email?: string };
  const user = await findUserByContact(body.contact ?? body.email ?? "");

  if (!user) {
    return NextResponse.json({ error: "No beta registrant exists for that email or phone." }, { status: 404 });
  }

  return NextResponse.json({ user });
}
