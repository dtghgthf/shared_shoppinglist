# Plan: Optimistic UI + Verbessertes Drag-and-Drop

## Context
Zwei Verbesserungen an der Einkaufslisten-App:
1. **Optimistic UI**: Änderungen (Hinzufügen, Abhaken, Umbenennen) sollen sofort in der UI sichtbar sein, nicht erst nach dem Supabase-Realtime-Event.
2. **Drag-and-Drop**: Mobile Touch-Support fehlt komplett. Außerdem fehlt eine visuelle Einrasteposition (Linie zwischen Items).

---

## Feature 1: Optimistic UI

### Strategie
- **Add Item**: Temp-UUID generieren, Item sofort in State einfügen. Wenn API antwortet → Temp durch echtes Item ersetzen. Race-Condition mit Realtime-INSERT gesondert behandeln.
- **Check/Uncheck**: `checked`-State sofort umschalten, dann API aufrufen.
- **Rename**: Text sofort in State aktualisieren, dann API aufrufen.

### Architektur-Problem: State-Brücke zwischen `AddItemForm` und `ShoppingList`
Da beide Komponenten Geschwister im Server Component `page.tsx` sind, brauchen sie eine State-Brücke. **Lösung: `ShoppingList` bleibt Besitzer des State + exponiert ein imperatives Handle via `useImperativeHandle`/`ref` (React 19 Ref-as-Prop Pattern).**

Neues `ListPageClient.tsx` als dünner Client-Wrapper, der:
- `AddItemForm` und `ShoppingList` rendert
- Den Ref auf ShoppingList hält
- `AddItemForm`-Callbacks (`onItemAdding`, `onItemAdded`) verdrahtet

### Race-Condition-Handling (INSERT-Event vs. `replaceTemp`)
In `ShoppingList.tsx`'s `replaceTemp`-Funktion:
```typescript
replaceTemp: (tempId: string, realItem: Item) => {
  setItems(prev => {
    const realAlreadyPresent = prev.some(i => i.id === realItem.id);
    if (realAlreadyPresent) {
      return prev.filter(i => i.id !== tempId); // INSERT kam zuerst → temp löschen
    }
    return prev.map(i => i.id === tempId ? realItem : i); // normal ersetzen
  });
}
```

### `order_index` für optimistisches Add
Client-seitig: `Math.max(...items.map(i => i.order_index), 0) + 1000` — entspricht genau der Server-Logik.

---

## Feature 2: Drag-and-Drop mit `@dnd-kit/core`

### Bibliothek
`@dnd-kit/core` + `@dnd-kit/utilities` — handles Mouse + Touch via PointerSensor.

### Drop-Position-Indikator
State `dropPosition: { targetId: string; position: 'before' | 'after' } | null` in `ShoppingList`.
- In `onDragOver`: Y-Position vs. Elementmitte → `before`/`after`
- Render: dünne farbige `<div>`-Linie (2px, `var(--accent)`) als Geschwister von `<ShoppingItem>` im `catItems.map()` Loop

### Reorder-Logik
Die bestehende Midpoint-`order_index`-Logik aus `handleDrop` wird in `@dnd-kit`'s `onDragEnd`-Callback verschoben. Cross-Category-Drag wird beibehalten.

---

## Dateien, die geändert werden

| Datei | Änderung |
|---|---|
| `src/components/ShoppingList.tsx` | `forwardRef` + `useImperativeHandle`, optimistische Handler für Toggle/Edit, `@dnd-kit` Integration, Drop-Indikator |
| `src/components/ShoppingItem.tsx` | Props `onToggle`, `onEdit` hinzufügen; `useDraggable`/`useDroppable` von `@dnd-kit` statt nativem HTML5 Drag |
| `src/components/AddItemForm.tsx` | Props `onItemAdding?: (item) => void` und `onItemAdded?: (tempId, realItem) => void` hinzufügen |
| `src/app/list/[id]/page.tsx` | `AddItemForm` + `ShoppingList` durch `<ListPageClient>` ersetzen |
| `src/components/ListPageClient.tsx` | **Neu**: Client-Wrapper mit Ref-Bridge und Callbacks |
| `package.json` | `@dnd-kit/core`, `@dnd-kit/utilities` installieren |

### Kritische bestehende Funktionen (wiederverwenden)
- `detectCategory(text)` in `src/lib/categories.ts` — für client-seitige Kategorie beim optimistischen Add
- Midpoint-`order_index`-Berechnung (Zeilen 81-92 in `ShoppingList.tsx`) — in `onDragEnd` übernehmen
- Realtime INSERT-Deduplizierung (Zeile 28) — beibehalten, wird durch `replaceTemp`-Logik ergänzt

---

## Implementierungs-Reihenfolge
1. `@dnd-kit` installieren
2. `ListPageClient.tsx` erstellen
3. `page.tsx` anpassen
4. `AddItemForm.tsx`: Callbacks hinzufügen
5. `ShoppingList.tsx`: `forwardRef`, optimistische Handler, `@dnd-kit`, Drop-Indikator
6. `ShoppingItem.tsx`: Props + `@dnd-kit` Hooks

---

## Verifikation
- Tab A: Item hinzufügen → erscheint sofort (ohne Realtime-Delay)
- Tab B: Sieht das neue Item nach dem Supabase-INSERT-Event
- Kein Duplikat in Tab A wenn Realtime-INSERT und API-Response racing
- Checkbox: togglet sofort auf Click
- Mobil: Drag-and-Drop funktioniert per Touch
- Drop-Indikator: Linie erscheint zwischen Items beim Ziehen
- Zwei Browser-Tabs: Alle Änderungen syncen korrekt via Realtime
