# Supabase Realtime + RLS Configuration Summary

## ✅ Configuration Complete

This document summarizes the changes made to configure Supabase Realtime subscriptions to work securely with Row Level Security (RLS) in the shopping list application.

## Changes Made

### 1. Database Migration: `004_realtime_config.sql`

**Location**: `/supabase/migrations/004_realtime_config.sql`

**What it does**:
- Sets `REPLICA IDENTITY FULL` on `items` and `lists` tables
  - Required for DELETE events to include all row data
  - Allows RLS policies to evaluate DELETE permissions
- Adds `items` and `lists` tables to the `supabase_realtime` publication
  - Enables Realtime PostgreSQL Change Data Capture (CDC)
- Includes comprehensive documentation about RLS + Realtime integration

**Why it matters**:
- DELETE events are critical for keeping UI in sync when items are removed
- Without `REPLICA IDENTITY FULL`, delete events don't include enough data for RLS evaluation
- Realtime publication must include the tables for CDC events to be captured

### 2. Enhanced ShoppingList Component: `src/components/ShoppingList.tsx`

**Location**: `/src/components/ShoppingList.tsx`

**Changes**:
- Added comprehensive JSDoc comment explaining RLS + Realtime integration
- Added inline comments explaining how RLS protects the subscription
- Documented why `REPLICA IDENTITY FULL` is needed for DELETE events
- Clarified that the subscription only receives events for accessible items

**How it works**:
```typescript
// The channel name includes the listId for organization
const channel = supabase
  .channel(`items:${listId}`)
  .on(
    "postgres_changes",
    { 
      event: "*",              // Subscribe to all event types
      schema: "public",        
      table: "items",          
      filter: `list_id=eq.${listId}`  // Only items from this list
    },
    (payload) => {
      // RLS ensures only accessible items are received here
      // No permission checks needed - RLS handles it automatically
    }
  )
  .subscribe();
```

**Security flow**:
1. User authenticates with Supabase → JWT in cookies
2. Browser client automatically includes JWT in WebSocket subscription
3. Database receives change event (INSERT/UPDATE/DELETE)
4. RLS policy is evaluated using `auth.uid()` from JWT
5. Event is delivered to subscription ONLY if user has access
6. Subscription filter (list_id) provides additional filtering

### 3. Documentation: `docs/REALTIME_RLS_INTEGRATION.md`

**Location**: `/docs/REALTIME_RLS_INTEGRATION.md`

**Covers**:
- How RLS policies are automatically enforced with Realtime
- Security implications and threat models
- Database configuration details
- Implementation examples
- Testing strategies
- Troubleshooting guide
- Performance considerations
- Security best practices

## How It Works End-to-End

### Scenario 1: User with Access ✅

```
User A owns List X
User A is subscribed to items in List X
Item is modified in List X by User B
├─ Database triggers change event
├─ Supabase checks RLS policy: "Is User A allowed to see List X items?"
├─ RLS says YES (User A owns the list)
├─ Event is sent to User A's subscription
└─ User A's UI updates in real-time
```

### Scenario 2: User Without Access ❌

```
User B owns List X  
User A has no access to List X
User A tries to subscribe to items in List X
├─ Subscription connects (no error)
├─ Item is modified in List X
├─ Database triggers change event
├─ Supabase checks RLS policy: "Is User A allowed to see List X items?"
├─ RLS says NO (User A not owner or member)
├─ Event is NOT sent to User A's subscription
└─ User A doesn't see the change (correct!)
```

### Scenario 3: Member with Different Permissions

```
User C owns List X
User A is member with "viewer" role (read-only)
Item is modified in List X
├─ Database triggers change event
├─ Supabase checks RLS policy for SUBSCRIBE
├─ RLS says YES (User A is a member)
├─ Event is sent to User A's subscription
├─ User A sees the update
├─ User A tries to modify the item via API
├─ API-level RLS policy checks "Can User A UPDATE this item?"
├─ RLS says NO (viewer role can't update)
└─ Update is rejected
```

## Key Configuration Points

### ✅ Authenticated Client

The browser client uses the authenticated session:

```typescript
// src/lib/supabase/client.ts
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// Authentication happens automatically via SSR middleware
// JWT is available in cookies for all requests and subscriptions
```

### ✅ RLS Policies Active

RLS is enabled on all tables and policies exist for:
- `items_select`: User can read items based on list access
- `items_insert`: User can add items based on list access
- `items_update`: User can update items based on list access  
- `items_delete`: User can delete items based on list access

(See `002_rls_policies.sql` for full policies)

### ✅ Realtime Publications Configured

Tables are added to the `supabase_realtime` publication:
- `items` → Realtime item changes
- `lists` → Realtime list metadata changes
- `profiles` → Realtime profile updates
- `list_members` → Realtime membership changes

### ✅ REPLICA IDENTITY FULL Set

Both critical tables have `REPLICA IDENTITY FULL`:
- `items` → Allows DELETE events to be evaluated by RLS
- `lists` → Allows list deletion to be broadcast properly

## Testing Checklist

### Before Deployment

- [ ] Run migration `004_realtime_config.sql` on production database
- [ ] Verify `REPLICA IDENTITY FULL` is set:
  ```sql
  SELECT schemaname, tablename, reloptions 
  FROM pg_class c 
  JOIN pg_namespace n ON n.oid = c.relnamespace 
  WHERE tablename IN ('items', 'lists');
  ```
- [ ] Verify Realtime publication includes tables:
  ```sql
  SELECT * FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime';
  ```

### During Testing

- [ ] Test with authenticated user:
  - Open list as User A
  - Have User B modify items in the same list
  - Verify User A sees changes in real-time ✅

- [ ] Test with unauthorized user:
  - Have User A try to access List B (no access)
  - Subscription connects but no events received ✅
  - Verify no items appear even as User B modifies them ✅

- [ ] Test DELETE operations:
  - Have User A add item to list
  - Delete item as User B
  - Verify User A sees item removal in real-time ✅

- [ ] Test with link-shared lists:
  - Create list with `visibility='link_write'`
  - Share link with User A
  - User A should see real-time updates ✅

## Troubleshooting

### No Real-time Updates Received

1. **Check authentication**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Authenticated?', user ? 'YES' : 'NO');
   ```

2. **Check RLS directly**:
   ```typescript
   const { data } = await supabase
     .from('items')
     .select('*')
     .eq('list_id', listId);
   // If this returns 0 rows, user doesn't have access
   ```

3. **Check WebSocket connection** (Browser DevTools → Network):
   - Look for WebSocket connection to realtime.supabase.co
   - Verify it's connected (Status: 101 Switching Protocols)

4. **Check server logs**:
   - Supabase Dashboard → Logs → PostgreSQL
   - Look for RLS policy violations

### DELETE Events Not Working

- Verify `REPLICA IDENTITY FULL` is set
- Run migration again to ensure setting is applied
- Restart PostgreSQL if needed

### Subscription Receives Unauthorized Events

- This should NOT happen with proper RLS
- If it does, verify:
  1. RLS is enabled on the table
  2. No `(true)` allow-all policies exist
  3. No public/anon key overrides exist
  4. User JWT is valid and not spoofed

## Next Steps

1. **Run the migration**: Execute `004_realtime_config.sql` on your Supabase database
2. **Test thoroughly**: Follow the testing checklist above
3. **Monitor**: Watch server logs for any RLS policy violations
4. **Scale**: Consider connection pooling for many concurrent subscriptions

## Files Modified/Created

- ✅ `supabase/migrations/004_realtime_config.sql` - Created
- ✅ `src/components/ShoppingList.tsx` - Enhanced with RLS documentation
- ✅ `docs/REALTIME_RLS_INTEGRATION.md` - Comprehensive guide created

## References

- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL Replication: https://www.postgresql.org/docs/current/sql-altertable.html
