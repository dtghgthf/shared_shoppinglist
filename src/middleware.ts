import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn(
      "⚠️ ADMIN_PASSWORD not set in environment. Admin routes are not protected."
    );
    return NextResponse.next();
  }

  // Check Basic Auth
  if (authHeader?.startsWith("Basic ")) {
    const credentials = authHeader.slice(6);
    const decoded = Buffer.from(credentials, "base64").toString("utf-8");
    const [_, password] = decoded.split(":");

    if (password === adminPassword) {
      return NextResponse.next();
    }
  }

  // Return 401 with Basic Auth challenge
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Dashboard"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
