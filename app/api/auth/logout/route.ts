import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("omnispace_session");
  response.cookies.delete("omnispace_active_ws");
  return response;
}
