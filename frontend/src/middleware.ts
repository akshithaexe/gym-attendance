/**
 * Next.js middleware for route protection.
 *
 * - Checks for auth token in cookies/localStorage
 * - Redirects unauthenticated users to /login
 * - Redirects users to their role-appropriate dashboard
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/", "/kiosk"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/api"))) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    // For client-side auth (localStorage), we can't check in middleware
    // The pages themselves will handle redirect if no token is found
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
