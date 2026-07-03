import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  try {
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     Apply middleware only to protected routes.
     Do NOT include:
     - /login
     - /signup
     - /_next
     - /api
    */
    "/owner/:path*",
    "/manager/:path*",
    "/staff/:path*"
  ],
};
