import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminSessionTtlSeconds,
  adminAuthConfigured,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export async function POST(request) {
  if (!adminAuthConfigured()) {
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const password = String(body?.password ?? "");
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createAdminSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: adminSessionTtlSeconds(),
  });
  return response;
}
