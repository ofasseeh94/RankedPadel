import { NextRequest, NextResponse } from "next/server";
import { betaSnapshot } from "@/lib/beta-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
  const adminCode = request.nextUrl.searchParams.get("adminCode") ?? undefined;
  const snapshot = await betaSnapshot(userId, adminCode);
  return NextResponse.json(snapshot);
}
