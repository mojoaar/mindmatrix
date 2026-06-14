import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  // Limit authentications (sign in, sign up, reset password, etc.) to 30 requests per minute
  const allowed = await rateLimit(ip, 30, 60000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait 1 minute." },
      { status: 429 }
    );
  }

  return handler.POST(request);
}
