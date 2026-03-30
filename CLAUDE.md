# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Geteilte Einkaufsliste** — a real-time collaborative shopping list app. Users create a list, share a QR code with friends, and all changes (add item, check off, reorder, delete) sync instantly across all connected browsers. Built with Next.js 16, Supabase real-time subscriptions, and Anthropic design tokens. UI entirely in German.

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000

# Production
npm run build            # Build for production
npm start                # Start production server (after build)

# Linting
npm run lint             # Run ESLint
npm run lint -- --fix    # Fix auto-fixable issues
```

---

## Architecture & Data Flow

### Real-Time Sync Pattern

The app uses **Supabase Postgres Change Streams** to broadcast mutations across all connected clients:

```
User Action (check item / add / reorder / delete)
    ↓
fetch() → Next.js API Route (/api/items)
    ↓
Supabase INSERT/UPDATE/DELETE
    ↓
Supabase WAL captures change
    ↓
Real-time WebSocket broadcasts to all subscribed clients
    ↓
ShoppingList.tsx `postgres_changes` handler fires on EVERY client
    ↓
React state update → re-render
```

**Key:** No optimistic UI on this app's primary actions (check, reorder) — state updates only on the real-time event. Deletions use optimistic removal locally, then sync via realtime to other tabs. This ensures strong consistency across all users.

### Category Auto-Detection

Items are automatically sorted into supermarket sections (Obst & Gemüse, Fleisch & Fisch, Milchprodukte, etc.) via keyword matching in `src/lib/categories.ts`. Keywords are matched against lowercased item text; unmatched items go to "Sonstiges". The detected category is shown as live feedback in `AddItemForm.tsx` as the user types.

### Drag-and-Drop Reordering

Items within a category can be dragged to reorder. The `order_index` column stores a floating-point value (initialized +1000 apart); when an item is dropped between two others, its `order_index` is set to the midpoint of the adjacent items. This fractional ordering avoids renumbering the entire list.

### Dark Mode Across Tabs

Dark mode is applied via a CSS class on `<html>` and synced across tabs:
- An inline script in `layout.tsx` (runs before React hydrates) reads `localStorage.theme` and applies `class="dark"` if needed
- `DarkModeToggle.tsx` listens for `storage` events to sync theme changes between tabs
- CSS variables in `globals.css` toggle between light/dark values

---

## Key Files & Patterns

### Real-Time Subscription
**`src/components/ShoppingList.tsx`**
- Subscribes to `postgres_changes` on the `items` table filtered by `list_id`
- Groups items by category, preserving the order defined in `CATEGORIES`
- Handles INSERT, UPDATE, DELETE events with strong consistency (no optimistic UI except delete)

### Category Detection
**`src/lib/categories.ts`**
- Exports `CATEGORIES` array with icon, id, and label
- Exports `KEYWORDS` map for keyword-to-category matching
- `detectCategory(text)` returns a category id via keyword search
- Called on every keystroke in `AddItemForm.tsx` to show live preview

### API Mutations
**`src/app/api/items/route.ts`**
- `POST`: Creates item with auto-detected category; assigns `order_index` as max + 1000
- `PATCH`: Updates `checked`, `order_index`, or `category`; allows reordering across categories
- `DELETE`: Removes item; other clients see deletion via realtime if `ALTER TABLE items REPLICA IDENTITY FULL` is set

### Supabase Clients
**`src/lib/supabase/client.ts`** — Browser singleton for real-time subscriptions
**`src/lib/supabase/server.ts`** — Per-request server client for initial data fetch

### Dark Mode Toggle
**`src/components/DarkModeToggle.tsx`**
- Always renders a `<button>` (no conditional rendering to avoid hydration mismatch)
- Listens for `storage` events to sync changes between tabs
- Applies/removes `dark` class on `<html>` and writes to `localStorage.theme`

---

## Database Schema

```sql
-- Run in Supabase SQL Editor before first use:

create table lists (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table items (
  id uuid primary key default uuid_generate_v4(),
  list_id text not null references lists(id) on delete cascade,
  text text not null,
  checked boolean not null default false,
  category text not null default 'sonstiges',
  order_index float8 not null default 0,
  created_at timestamptz default now()
);

create index items_list_id_idx on items(list_id);

alter table items replica identity full;  -- For DELETE events to include full row data
alter publication supabase_realtime add table items;
```

**Important:** `REPLICA IDENTITY FULL` must be set for DELETE events to propagate the item's `id` to other subscribed clients.

---

## Styling & Design System

**CSS Variables** (in `src/app/globals.css`):
```css
/* Light mode (default) */
--bg: #f5f4ed              /* Page background */
--bg-elevated: #efede6     /* Cards, elevated surfaces */
--text-primary: #141413    /* Main text */
--text-secondary: #30302e  /* Secondary text */
--accent: #d97757          /* Orange CTA, highlights */
--border-subtle: #c2c0b6   /* Light borders */
--border-strong: #87867f   /* Stronger borders, icons */
--item-hover: rgba(0, 0, 0, 0.04)
--item-drag: rgba(217, 119, 87, 0.08)

/* Dark mode (when .dark class on <html>) */
/* (inverted values for readability) */
```

Colors **directly from Anthropic's design system**. Typography: Georgia (serif) for headings, system-ui (sans) for body. Border radius: 4px. Hover animations: `scale(1.05)` with `0.2s` transitions.

---

## Environment Variables

**`.env.local`** (required for dev, set in Vercel dashboard for production):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://shoppinglist.echterhofflabs.me  # For QR code generation
```

---

## Deployment

Deployed on **Vercel** with custom domain `shoppinglist.echterhofflabs.me` (via Namecheap DNS → CNAME to Vercel). Auto-deploys on push to main branch.

---

## Known Quirks & Gotchas

1. **Hydration warnings:** `suppressHydrationWarning` on `<html>` and `<body>` — intentional for dark mode class applied before React hydrates.

2. **QR Scanner:** `html5-qrcode` must be dynamically imported inside `useEffect` to avoid SSR errors (it references `document`/`navigator` at module load).

3. **Delete sync:** Deletes are optimistic in the originating tab (removed immediately), but other tabs see the change via realtime only if `REPLICA IDENTITY FULL` is set on the items table.

4. **Fractional order_index:** Dragging items repeatedly may create very close fractional values; this is fine — Postgres handles float precision. If concerned, add a migration to renumber, but it's not necessary for normal use.

5. **German UI:** All user-facing text is in German. Search string literals like "Artikel hinzufügen" or "Obst & Gemüse" to find user strings.

---

## Testing Real-Time Locally

Open two browser tabs to the same list:
- Tab A: Check an item → Tab B sees checkbox update instantly
- Tab A: Add an item → Tab B shows it categorized immediately
- Tab A: Drag an item → Tab B sees reorder within the same category
- Tab A: Delete an item → Tab B sees it removed (if REPLICA IDENTITY FULL is set)

For mobile QR scanning locally, use `npx ngrok http 3000` to expose the dev server over HTTPS, then scan on a phone.
