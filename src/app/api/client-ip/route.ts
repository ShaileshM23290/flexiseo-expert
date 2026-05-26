import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/request-ip";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  return NextResponse.json({ ip });
}
