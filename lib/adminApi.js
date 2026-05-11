import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminTokenValid } from "@/lib/adminAuth";

export function ensureAdminRequest(request) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isAdminTokenValid(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}
