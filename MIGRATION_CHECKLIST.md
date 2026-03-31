# Migration Checklist - Supabase SSR

This checklist helps you update your existing code to work with the new `@supabase/ssr` clients.

## 🔍 Step 1: Audit Current Usage

Find all files that use Supabase clients:

```bash
# Find files importing from supabase clients
grep -r "from '@/lib/supabase" src/ --include="*.ts" --include="*.tsx"
grep -r "import.*createServerClient" src/ --include="*.ts" --include="*.tsx"
```

## ✅ Step 2: Update Browser Client Usage

### Pattern: No Changes Needed (Usually)
If you're using the browser client in Client Components, no changes are needed:

```typescript
// ✅ Already works - no change needed
'use client'
import { supabase } from '@/lib/supabase/client'

export default function MyComponent() {
  const handleLogin = async () => {
    await supabase.auth.signInWithPassword(...)
  }
}
```

## ✅ Step 3: Update Server Client Usage

### CRITICAL: All calls must now be awaited

#### Pattern 1: Server Components
```typescript
// ❌ BEFORE (won't work anymore)
import { createServerClient } from '@/lib/supabase/server'

export default function MyComponent() {
  const client = createServerClient()  // ← ERROR: Not async!
  const { data } = await client.from('items').select('*')
}

// ✅ AFTER (correct way)
import { createServerClient } from '@/lib/supabase/server'

export default async function MyComponent() {
  const client = await createServerClient()  // ← Add await!
  const { data } = await client.from('items').select('*')
}
```

#### Pattern 2: Server Actions
```typescript
// ❌ BEFORE
'use server'
import { createServerClient } from '@/lib/supabase/server'

export async function fetchLists() {
  const client = createServerClient()  // ← ERROR: Missing await!
  return await client.from('lists').select('*')
}

// ✅ AFTER
'use server'
import { createServerClient } from '@/lib/supabase/server'

export async function fetchLists() {
  const client = await createServerClient()  // ← Add await!
  return await client.from('lists').select('*')
}
```

#### Pattern 3: API Routes
```typescript
// ❌ BEFORE
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const client = createServerClient()  // ← ERROR: Missing await!
  const { data } = await client.from('items').select('*')
  return Response.json(data)
}

// ✅ AFTER
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const client = await createServerClient()  // ← Add await!
  const { data } = await client.from('items').select('*')
  return Response.json(data)
}
```

#### Pattern 4: Database Queries
```typescript
// ❌ BEFORE
const client = createServerClient()
const { data: items } = await client.from('items').select('*')

// ✅ AFTER
const client = await createServerClient()  // ← Add await!
const { data: items } = await client.from('items').select('*')
```

#### Pattern 5: Complex Operations
```typescript
// ❌ BEFORE
const client = createServerClient()
const { data: user } = await client.auth.getUser()
const { data: items } = await client.from('items').select('*')

// ✅ AFTER
const client = await createServerClient()  // ← Add await!
const { data: user } = await client.auth.getUser()
const { data: items } = await client.from('items').select('*')
```

## ✅ Step 4: Update Middleware (if using)

### Pattern: Add Session Refresh
```typescript
// Example middleware.ts

import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // This will refresh the session on every request
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## 🧪 Step 5: Testing Checklist

After making changes, test:

- [ ] Browser client works in Client Components
- [ ] Server client works in Server Components
- [ ] Server client works in Server Actions
- [ ] Server client works in API routes
- [ ] Authentication flows work (login, logout, signup)
- [ ] Session persistence works across page reloads
- [ ] Middleware refreshes sessions correctly (if configured)
- [ ] Cookie management works (set/get/delete)
- [ ] Error handling works as expected

## 🔍 Step 6: Find Files to Update

### Common patterns to search for:

```bash
# Find all createServerClient calls
grep -r "createServerClient()" src/ --include="*.ts" --include="*.tsx"

# Find imports of createServerClient
grep -r "from '@/lib/supabase/server'" src/ --include="*.ts" --include="*.tsx"

# Find specific files likely needing updates
find src -name "*.server.ts" -o -name "*action*.ts" -o -name "api/**/*.ts"
```

## 📝 Example Files to Check

Files in your app likely to need updates:

- `src/app/api/**/*.ts` - All API routes
- `src/app/**/*.tsx` - Server Components
- Any files with `"use server"` directive
- Any middleware files
- Layout components that fetch data

## 🚨 Common Issues & Fixes

### Issue: "createServerClient is not a function"
```typescript
// ❌ Wrong
const client = createServerClient()

// ✅ Fix
const client = await createServerClient()
```

### Issue: "Promise is not a Supabase client"
```typescript
// ❌ Wrong - using the promise instead of awaiting
const promise = createServerClient()
const { data } = await promise.from('table').select('*')

// ✅ Fix
const client = await createServerClient()
const { data } = await client.from('table').select('*')
```

### Issue: "Can't await in synchronous function"
```typescript
// ❌ Wrong - function is not async
export function MyComponent() {  // ← Should be async!
  const client = await createServerClient()
}

// ✅ Fix
export async function MyComponent() {  // ← Add async!
  const client = await createServerClient()
}
```

### Issue: Cookies not persisting
```typescript
// ✅ Solution: Add middleware to refresh sessions
// See Step 4 above
```

## 📋 File-by-File Template

Use this template to update each file:

```typescript
// BEFORE
import { createServerClient } from '@/lib/supabase/server'

export async function myFunction() {
  const client = createServerClient()  // ← ADD: await
  const { data } = await client.from('table').select('*')
  return data
}

// AFTER
import { createServerClient } from '@/lib/supabase/server'

export async function myFunction() {
  const client = await createServerClient()  // ← FIXED: added await
  const { data } = await client.from('table').select('*')
  return data
}
```

## ✅ Verification

Once you've updated everything, run:

```bash
# Check TypeScript compilation
npm run build

# Or just check types
npx tsc --noEmit

# Run any tests you have
npm run test
```

## 📚 Need Help?

- Read `SUPABASE_SSR_GUIDE.md` for detailed usage examples
- Read `SSR_REFACTORING_SUMMARY.md` for what changed
- Check `plan.md` for implementation details
- Visit the [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side)

---

## Priority Order

Update files in this priority order:

1. **High Priority** (will break immediately)
   - API routes using `createServerClient()`
   - Server Actions using `createServerClient()`
   - Layout components fetching data

2. **Medium Priority** (may break on auth)
   - Authentication-related components
   - User profile pages
   - Any pages with `'use server'`

3. **Low Priority** (can update later)
   - Client Components (usually no changes needed)
   - Utility functions
   - Non-critical pages

## Quick Reference

```typescript
// Browser client - NO CHANGE NEEDED
import { supabase } from '@/lib/supabase/client'
const { data } = await supabase.from('table').select()

// Server client - MUST ADD AWAIT!
import { createServerClient } from '@/lib/supabase/server'
const client = await createServerClient()  // ← MUST AWAIT
const { data } = await client.from('table').select()

// Middleware - Use for session refresh
import { updateSession } from '@/lib/supabase/middleware'
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```
