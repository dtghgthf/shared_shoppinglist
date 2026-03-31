# Supabase Realtime with Row Level Security (RLS) Configuration

## Overview

This shopping list application uses Supabase Realtime subscriptions that automatically respect Row Level Security (RLS) policies. This ensures that users only receive real-time updates for items they have permission to access.

## How It Works

### 1. Authentication & Session Management

The application uses Supabase SSR (Server-Side Rendering) helpers for proper session management:

- **Server-side**: `createServerClient` (in middleware.ts) manages authentication cookies
- **Client-side**: `createBrowserClient` (in client.ts) uses the authenticated session for subscriptions

When a user logs in, their session is stored in cookies, and the browser client automatically includes their JWT token in all requests and subscriptions.

### 2. RLS Policy Enforcement with Realtime

When a Realtime subscription receives an event (INSERT, UPDATE, DELETE), Supabase:

1. **Evaluates the RLS policy** using the user's JWT claims (auth.uid())
2. **Checks if the user has access** to the specific row
3. **Only delivers the event** if the RLS policy allows it
4. **Applies the subscription filter** (e.g., `list_id=eq.${listId}`)

### 3. Subscription Security

**Scenario**: User A tries to subscribe to items in List B (which they don't have access to)

```typescript
const channel = supabase
  .channel(`items:list_b_id`)
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'items', 
      filter: `list_id=eq.list_b_id` 
    },
    (payload) => { /* ... */ }
  )
  .subscribe();
```

**What happens**:
- ✅ The subscription connects successfully (no permission error on subscribe)
- ❌ **BUT**: No events are delivered because RLS policies block access
- The user sees an empty list with no realtime updates

This is the correct behavior—the subscription doesn't fail (good UX), but no unauthorized data leaks.

## Database Configuration

### REPLICA IDENTITY FULL

The migration file `004_realtime_config.sql` sets `REPLICA IDENTITY FULL` on the `items` and `lists` tables:

```sql
ALTER TABLE items REPLICA IDENTITY FULL;
ALTER TABLE lists REPLICA IDENTITY FULL;
```

**Why this matters**:
- DELETE events normally don't include the old row data
- With `REPLICA IDENTITY FULL`, DELETE events include all columns of the deleted row
- This allows RLS policies to evaluate who had access to the deleted item
- Without it, DELETE events might leak information or cause sync issues

### Realtime Publication

The migration adds tables to the Supabase Realtime publication:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE lists;
```

**Important**: These statements are idempotent and won't error if the tables are already included.

## RLS Policies in Action

### Items Table Policy (from 002_rls_policies.sql)

```sql
CREATE POLICY "items_select" ON items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lists WHERE lists.id = items.list_id AND (
      lists.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM list_members WHERE list_id = lists.id AND user_id = auth.uid()) OR
      lists.visibility IN ('link_read', 'link_write') OR
      lists.owner_id IS NULL
    )
  )
);
```

This policy means a user can read an item if they:
- Own the list
- Are a member of the list
- Have access via link (public/link_read/link_write)
- The list is unclaimed (owner_id IS NULL)

**With Realtime**: This same policy applies to subscription events. Users only receive updates for items that satisfy these conditions.

## Implementation Details

### ShoppingList Component (ShoppingList.tsx)

The component sets up a realtime subscription:

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`items:${listId}`)
    .on(
      "postgres_changes",
      { 
        event: "*", 
        schema: "public", 
        table: "items", 
        filter: `list_id=eq.${listId}` 
      },
      (payload) => {
        // Handle INSERT, UPDATE, DELETE events
        // RLS ensures only authorized events are received
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [listId]);
```

**Key points**:
- The subscription filter `list_id=eq.${listId}` narrows events to a specific list
- RLS policies provide an additional security layer
- The component doesn't need to perform permission checks—RLS handles it
- Optimistic updates are used locally while the server processes the change

### Authenticated Client

The browser client is created with the Supabase public key and uses the authenticated session:

```typescript
// src/lib/supabase/client.ts
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**How authentication works**:
1. User logs in via `/api/auth/...` endpoints
2. Supabase session (JWT) is stored in cookies
3. The browser client automatically reads the session from cookies
4. All subscriptions include the JWT in the WebSocket connection
5. RLS policies evaluate using `auth.uid()` from the JWT

## Testing RLS with Realtime

### Test 1: Owner receives updates

```typescript
// List owned by user A
// User A subscribes → receives all events ✅
```

### Test 2: Member receives updates

```typescript
// List owned by user B, user A is editor member
// User A subscribes → receives all events ✅
```

### Test 3: Non-member doesn't receive updates

```typescript
// List owned by user B, user A has no access
// User A subscribes → receives NO events ❌
```

### Test 4: Link-shared list member receives updates

```typescript
// List with visibility='link_write', user A has link
// User A subscribes → receives UPDATE/INSERT events ✅
```

## Common Issues & Troubleshooting

### Issue: Not receiving realtime updates

**Possible causes**:
1. User is not authenticated (check browser DevTools → Application → Cookies for `sb-*` cookies)
2. RLS policy doesn't grant access to the list
3. Realtime subscription hasn't been added to the publication
4. WebSocket connection is blocked (proxy/firewall)

**Debug steps**:
```typescript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('Authenticated user:', user);

// Check RLS by trying a query
const { data, error } = await supabase
  .from('items')
  .select('*')
  .eq('list_id', listId);
console.log('Query result:', data || error);
```

### Issue: DELETE events not working

**Cause**: `REPLICA IDENTITY FULL` not set on the table

**Fix**: Run the migration `004_realtime_config.sql` to set it properly.

### Issue: Data leaking to unauthorized users

**This should not happen** if RLS policies are correctly configured.

**Debug steps**:
1. Review the RLS policies in `002_rls_policies.sql`
2. Check that `ENABLE ROW LEVEL SECURITY` is set on all tables
3. Verify no `POLICY ... (true)` allow-all policies exist
4. Test with a user account that shouldn't have access

## Performance Considerations

### Subscription Overhead

- Realtime subscriptions are persistent WebSocket connections
- Each browser tab has its own connection
- Consider using a single shared subscription context for multiple lists

### RLS Policy Performance

- RLS policies are evaluated for every event
- Complex policies (many EXISTS checks) may impact performance
- Consider indexing foreign keys: `list_id`, `user_id`, `owner_id`

**Current indexes** (verify with):
```sql
SELECT * FROM pg_indexes WHERE tablename IN ('items', 'lists', 'list_members');
```

## Security Best Practices

1. ✅ **Always use authenticated client** for subscriptions that need RLS
2. ✅ **Set REPLICA IDENTITY FULL** on tables with sensitive DELETE operations
3. ✅ **Test RLS policies** with multiple user accounts
4. ✅ **Use WSS (WebSocket Secure)** for production (Supabase handles this)
5. ✅ **Combine RLS with validation** in API endpoints for defense in depth
6. ❌ **Never disable RLS** to "fix" permission issues
7. ❌ **Never use service role key** in browser clients

## References

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL REPLICA IDENTITY](https://www.postgresql.org/docs/current/sql-altertable.html#SQL-ALTERTABLE-REPLICA-IDENTITY)
- [Application Architecture](./APPLICATION_ARCHITECTURE.md)
