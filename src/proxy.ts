import { NextRequest, NextResponse } from "next/server";
import { leerSesionFirmada, SESSION_COOKIE } from "@/lib/session-token";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login" || !["GET", "HEAD"].includes(request.method)) {
    return NextResponse.next();
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!(await leerSesionFirmada(token))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico).*)"],
};
