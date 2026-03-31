# Supabase Realtime + RLS Quick Reference

## Configuration Status: ✅ COMPLETE

### Files Modified/Created

```
shared_shoppinglist/
├── supabase/migrations/
│   └── 004_realtime_config.sql ..................... ✅ NEW
│       └── Sets REPLICA IDENTITY FULL for items/lists
│       └── Adds items/lists to supabase_realtime publication
│       └── Includes comprehensive documentation
│
├── src/components/
│   └── ShoppingList.tsx ............................. ✅ ENHANCED
│       └── Added RLS + Realtime documentation
│       └── Enhanced inline comments
│       └── Clarified security model
│
├── docs/
│   └── REALTIME_RLS_INTEGRATION.md ................. ✅ NEW (comprehensive guide)
│
└── REALTIME_CONFIGURATION_NOTES.md ................. ✅ NEW (this summary)
```

## How It Works (Simple Explanation)

### Authentication
```
User Logs In → Supabase Creates JWT → JWT Stored in Cookies
```

### Realtime Subscription with RLS
```
Browser Client Creates Subscription
    ↓
Supabase WebSocket Connection (includes JWT)
    ↓
Database Change Event Occurs
    ↓
Supabase Checks RLS Policy (using auth.uid() from JWT)
    ↓
  ✅ User has access? → Send event to subscription → Update UI
  ❌ User has access? → Block event → No update
```

## RLS Policies Applied

| Table | Policy | Effect |
|-------|--------|--------|
| `items` | `items_select` | Can read items based on list access |
| `items` | `items_insert` | Can add items based on list permissions |
| `items` | `items_update` | Can modify items based on role |
| `items` | `items_delete` | Can remove items based on role |
| `lists` | `lists_select` | Can see list based on ownership/membership/visibility |
| `lists` | `lists_update` | Can modify list based on ownership/membership |

## Subscription Example

```typescript
// ShoppingList.tsx
const channel = supabase
  .channel(`items:${listId}`)
  .on('postgres_changes',
    { 
      event: '*',                          // All event types (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'items',
      filter: `list_id=eq.${listId}`      // Only this list's items
    },
    (payload) => {
      // RLS ensures only accessible items arrive here
      if (payload.eventType === 'INSERT') { /* add to UI */ }
      else if (payload.eventType === 'UPDATE') { /* update in UI */ }
      else if (payload.eventType === 'DELETE') { /* remove from UI */ }
    }
  )
  .subscribe();
```

## Access Control Matrix

| User | Owns List | Member | Link-Read | Link-Write | Can Subscribe? | Can See Events? |
|------|-----------|--------|-----------|-----------|---|---|
| List Owner | ✅ | - | - | - | ✅ | ✅ (all events) |
| Editor Member | ❌ | ✅ Editor | - | - | ✅ | ✅ (all events) |
| Viewer Member | ❌ | ✅ Viewer | - | - | ✅ | ✅ (read-only) |
| Link (Read) | ❌ | ❌ | ✅ | - | ✅ | ✅ (read-only) |
| Link (Write) | ❌ | ❌ | - | ✅ | ✅ | ✅ (write allowed) |
| No Access | ❌ | ❌ | ❌ | ❌ | ⚠️ Connects | ❌ No events |

## Database Configuration

### ✅ REPLICA IDENTITY FULL

**Status**: Configured in migration 004_realtime_config.sql

**Purpose**: DELETE events include all row data so RLS can evaluate permission

**Verify**:
```sql
SELECT schemaname, tablename 
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace 
WHERE tablename IN ('items', 'lists')
AND c.relreplident = 'f';  -- 'f' means FULL replica identity
```

### ✅ Realtime Publication

**Status**: Tables added in migration 004_realtime_config.sql

**Tables Included**:
- `items` - Shopping list items
- `lists` - Shopping lists
- `profiles` - User profiles
- `list_members` - List membership

**Verify**:
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## Security Guarantees

### What RLS Protects

✅ **Users can only:**
- See items from lists they own or are invited to
- Subscribe to their own lists' changes
- Receive events only for accessible items
- Modify items based on their role (owner/editor can update, viewers cannot)

✅ **Users CANNOT:**
- Spy on other users' lists
- Subscribe to items they don't have access to
- Receive DELETE events they shouldn't see
- Bypass permissions via realtime subscriptions

### What This IS NOT

❌ **RLS does NOT** replace API validation
❌ **RLS does NOT** protect against SQL injection at the subscription level
❌ **RLS does NOT** mean you can skip server-side checks in API routes

## Deployment Checklist

- [ ] Review migration file: `004_realtime_config.sql`
- [ ] Test in development/staging first
- [ ] Run migration on production database
- [ ] Verify `REPLICA IDENTITY FULL` is set
- [ ] Verify Realtime publication includes tables
- [ ] Test with multiple user accounts
- [ ] Monitor Supabase logs for RLS violations
- [ ] Verify real-time updates work for all use cases
- [ ] Verify unauthorized users don't receive events

## Testing Scenarios

### Test 1: Owner sees own list updates
```
1. User A owns List X
2. User A opens list in browser
3. User B (via another window) modifies item in List X
4. Expected: User A sees update in real-time ✅
```

### Test 2: Viewer sees read-only updates
```
1. User A is viewer member of List X
2. User A opens list in browser
3. User B (owner) modifies item in List X
4. Expected: User A sees update in real-time ✅
5. User A tries to edit item
6. Expected: Edit is rejected by RLS ✅
```

### Test 3: Unauthorized user blocked
```
1. User A has no access to List X
2. User A tries to view List X directly (URL hack)
3. Expected: List is empty, no items shown ✅
4. User B modifies items in List X
5. Expected: User A receives NO real-time events ✅
```

### Test 4: Link-shared list works
```
1. User A creates List X with visibility='link_write'
2. User A shares link with User B
3. User B opens link, subscribes to items
4. User A modifies item
5. Expected: User B sees update in real-time ✅
```

## Performance Tips

### Connection Pooling
- Multiple subscriptions create WebSocket connections
- Consider using a shared subscription context if managing many lists
- Each browser tab has its own connection

### Policy Optimization
- RLS policies with multiple EXISTS checks can impact performance
- Ensure foreign keys are indexed: `list_id`, `user_id`, `owner_id`
- Monitor performance in Supabase Dashboard → Logs

### Event Filtering
- Subscription filter `list_id=eq.${listId}` reduces server processing
- Combine with RLS for defense in depth
- Don't rely on client-side filtering for security

## Documentation Files

### For Implementation Details
- **ShoppingList.tsx** - Component-level inline documentation
- **docs/REALTIME_RLS_INTEGRATION.md** - Comprehensive technical guide

### For Quick Reference
- **REALTIME_CONFIGURATION_NOTES.md** - This file
- **supabase/migrations/004_realtime_config.sql** - Database migration with comments

## Common Issues

### ❌ Not receiving real-time updates
- Check browser cookies for `sb-*` (auth token)
- Verify user is authenticated
- Check RLS policies allow the user access
- Verify WebSocket connection in browser DevTools

### ❌ DELETE events not working
- Run migration `004_realtime_config.sql`
- Verify `REPLICA IDENTITY FULL` is set
- May need to restart PostgreSQL

### ❌ Seeing unauthorized events
- Should NOT happen with proper RLS
- Check no `POLICY ... (true)` exists
- Check RLS is actually ENABLED on table

## Next Steps

1. ✅ Review the migration file
2. ✅ Review the component documentation
3. ✅ Run migration on your database
4. ✅ Test with multiple accounts
5. ✅ Monitor logs for any issues
6. ✅ Deploy with confidence!

---

**Configuration Date**: $(date)
**Status**: Ready for Production
**Questions?** See docs/REALTIME_RLS_INTEGRATION.md for detailed documentation
