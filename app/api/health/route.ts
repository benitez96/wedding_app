import { NextResponse } from "next/server";

/**
 * Health check endpoint.
 * Also used by NetworkMonitor for latency measurement (HEAD request).
 */
export async function GET() {
  try {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}

/**
 * Lightweight HEAD request for network latency measurement
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
