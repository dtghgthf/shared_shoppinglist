import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/auth/callback", "/reset-password"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle admin routes with Basic Auth (existing functionality)
  if (pathname.startsWith("/admin")) {
    return handleAdminAuth(request);
  }

  // Handle authentication and session refresh for all other routes
  return handleAuthAndSession(request);
}

function handleAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return new NextResponse("Admin routes not configured", { status: 503 });
  }

  // Check Basic Auth
  if (authHeader?.startsWith("Basic ")) {
    const credentials = authHeader.slice(6);
    const decoded = Buffer.from(credentials, "base64").toString("utf-8");
    const [, password] = decoded.split(":");

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

async function handleAuthAndSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { supabase, response } = createMiddlewareClient(request);

  // Refresh session to keep user logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // If not authenticated and route is protected, redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/signup, redirect to home
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
