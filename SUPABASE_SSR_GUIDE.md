# Supabase SSR Configuration Guide

This guide explains how to use the refactored Supabase clients with @supabase/ssr support for proper authentication and session management in Next.js 16.

## Files Overview

### 1. Browser Client (`src/lib/supabase/client.ts`)

**Use Case:** Client-side operations only, such as in Client Components and interactive features.

```typescript
import { supabase } from '@/lib/supabase/client'

// Example: Client Component
export default function LoginForm() {
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }
}
```

**Features:**
- Uses `createBrowserClient` from `@supabase/ssr`
- Automatically manages localStorage for session data
- Compatible with all browser-based operations
- Keep the same `supabase` export name for backward compatibility

---

### 2. Server Client (`src/lib/supabase/server.ts`)

**Use Case:** Server Components, Server Actions, and API routes.

```typescript
import { createServerClient } from '@/lib/supabase/server'

// Example: Server Component
export default async function Dashboard() {
  const client = await createServerClient()
  const { data, error } = await client.from('items').select('*')
}

// Example: Server Action
'use server'
export async function fetchLists() {
  const client = await createServerClient()
  return await client.from('lists').select('*')
}

// Example: API Route
export async function GET(request: Request) {
  const client = await createServerClient()
  const { data } = await client.from('items').select('*')
  return Response.json(data)
}
```

**Important Notes:**
- **The function is now `async`** - You must `await` the call to `createServerClient()`
- Uses `createServerClient` from `@supabase/ssr`
- Automatically handles cookie get/set/remove through `next/headers`
- Properly manages session cookies for authentication
- Try-catch blocks around cookie operations handle Server Component limitations
- Keep the same export name `createServerClient` for backward compatibility

---

### 3. Middleware (`src/lib/supabase/middleware.ts`)

**Use Case:** Next.js middleware for session refresh and authentication checks.

Two functions are available:

#### `createMiddlewareClient(request: NextRequest)`
Creates a Supabase client for middleware without automatic session refresh.

```typescript
// middleware.ts
import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  
  // Use supabase for auth checks, etc.
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

#### `updateSession(request: NextRequest)`
Refreshes user sessions automatically on each request.

```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**Features:**
- Proper cookie handling in middleware context
- Session refresh support
- Works with NextRequest/NextResponse
- Enables automatic authentication state updates

---

## Migration Guide

If updating from the old implementation:

### Before (Old)
```typescript
// client.ts
import { createClient } from "@supabase/supabase-js"
export const supabase = createClient(url, key)

// server.ts
import { createClient } from "@supabase/supabase-js"
export function createServerClient() {
  return createClient(url, key)
}
```

### After (New)
```typescript
// client.ts
import { createBrowserClient } from "@supabase/ssr"
export const supabase = createBrowserClient(url, key)

// server.ts
import { createServerClient as createSSRServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
export async function createServerClient() {
  const cookieStore = await cookies()
  return createSSRServerClient(url, key, {
    cookies: { /* handlers */ }
  })
}
```

### Key Changes:
1. **Server client is now async** - Update all calls to `await createServerClient()`
2. **Cookie handling is explicit** - Implement getAll/setAll/remove callbacks
3. **Better session management** - Cookies are automatically synced

---

## Environment Variables

Both clients use these environment variables:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These must be set in your `.env.local` file for the application to work.

---

## Error Handling

### Server Component Cookie Errors
You may see errors about setting cookies in Server Components. This is expected behavior when operations happen outside the request context. The code includes try-catch blocks to handle this gracefully.

```typescript
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) =>
      cookieStore.set(name, value, options)
    )
  } catch {
    // Ignored - middleware handles this
  }
}
```

### Middleware Session Management
If using `updateSession`, ensure your middleware is set up correctly to handle all routes that need session updates.

---

## Best Practices

1. **Use browser client in Client Components**
   - Only for interactive features requiring user input
   - Leverages browser storage for sessions

2. **Use server client in Server Components**
   - Preferred for data fetching and security-critical operations
   - Always `await` the function

3. **Use middleware for session refresh**
   - Call `updateSession` to keep sessions fresh on every request
   - Prevents token expiration during user activity

4. **Keep backward compatibility**
   - Exported names remain the same (`supabase`, `createServerClient`)
   - Existing code doesn't need to change (except `await` for server client)

---

## Troubleshooting

### Session not persisting across requests
- Ensure middleware is configured to run on all routes
- Use `updateSession` for automatic session refresh

### Cookies not being set
- Check that middleware is enabled for the route
- Verify environment variables are set correctly
- Look for try-catch errors in server logs

### Authentication failing
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that you're using the correct client (browser vs server)
- Ensure cookies are enabled in your browser

---

## Additional Resources

- [@supabase/ssr Documentation](https://supabase.com/docs/guides/auth/server-side)
- [Next.js Middleware Guide](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
