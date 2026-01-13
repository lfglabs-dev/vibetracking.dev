import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Reserved paths that should not be treated as usernames
const RESERVED_PATHS = [
  "api",
  "auth",
  "battle",
  "import",
  "opengraph-image",
  "og",
  "team",
  "test",
  "twitter-image",
  "user",
  "_next",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle /@username -> /user/username redirect (legacy support)
  if (pathname.startsWith("/@")) {
    const username = pathname.slice(2); // Remove "/@"
    const url = request.nextUrl.clone();
    url.pathname = `/user/${username}`;
    return NextResponse.rewrite(url);
  }

  // Handle /username -> /user/username (new clean URLs)
  // Only if it's not a reserved path and looks like a username
  const pathSegments = pathname.split("/").filter(Boolean);
  if (
    pathSegments.length === 1 &&
    !RESERVED_PATHS.includes(pathSegments[0]) &&
    !pathSegments[0].includes(".")
  ) {
    const username = pathSegments[0];
    const url = request.nextUrl.clone();
    url.pathname = `/user/${username}`;
    return NextResponse.rewrite(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
