# Supabase SSR Refactoring Plan

## Overview
Refactor Supabase clients to use `@supabase/ssr` package for proper authentication and session management support in Next.js 16.

## Files to Update

### 1. Browser Client (`src/lib/supabase/client.ts`)
- Replace `createClient` from `@supabase/supabase-js` with `createBrowserClient` from `@supabase/ssr`
- Keep the same export name `supabase` for backward compatibility
- Works client-side only, handles localStorage automatically

### 2. Server Client (`src/lib/supabase/server.ts`)
- Replace `createClient` with `createServerClient` from `@supabase/ssr`
- Import `cookies()` from `next/headers` (async in Next.js 16)
- Implement cookie get/set/remove handlers for session management
- Keep the same `createServerClient()` function export for backward compatibility
- Must be async to handle cookie operations

### 3. New Middleware File (`src/lib/supabase/middleware.ts`)
- Create new file for use in Next.js middleware
- Use `createServerClient` with appropriate cookie handling for middleware context
- Enable session refresh on each request

## Implementation Details

### Browser Client Pattern
```typescript
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(url, key)
export { supabase }
```

### Server Client Pattern
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(url, key, {
    cookies: {
      getAll() { /* get all cookies */ },
      setAll(cookies) { /* set multiple cookies */ },
      remove(name) { /* remove a cookie */ },
    }
  })
}
```

### Middleware Pattern
Similar to server client but designed for middleware context

## Key Differences from Original
1. Browser client uses SSR-specific implementation
2. Server client requires async/await for cookies
3. Cookie management is explicit through callbacks
4. Proper session refresh support
5. Better authentication flow handling
