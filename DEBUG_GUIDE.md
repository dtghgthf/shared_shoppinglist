# Debug Logging System - Benutzerhandbuch

## Überblick

Das Debug-Logging-System erfasst vollständige Informationen über jeden Upload-Prozess und speichert diese in JSON-Dateien.

## Was wird gelogged?

Für jeden Upload wird eine Datei im Format `upload_TIMESTAMP_FILENAME.json` erstellt mit:

```json
{
  "timestamp": "ISO-8601 Zeitstempel",
  "listId": "UUID der Liste",
  "fileName": "Dateiname",
  "fileType": "MIME-Type",
  "fileSize": "Bytes",
  "existingItems": [
    {
      "id": "Item-UUID",
      "text": "Artikel-Text",
      "checked": "bool"
    }
  ],
  "aiPrompt": "Der komplette Prompt, den die AI erhielt",
  "aiResponse": "Die komplette Rohantwort der AI",
  "parsedResult": {
    "new": ["Array der neuen Artikel"],
    "updates": [
      {
        "id": "Item-UUID",
        "text": "Aktualisierter Text mit Menge"
      }
    ]
  },
  "finalResult": {
    "newItemsCount": 5,
    "updatesCount": 3,
    "message": "Erfolgs-/Fehlermeldung"
  },
  "durationMs": 2450,
  "error": "Falls fehler aufgetreten"
}
```

## Log-Dateien analysieren

### Automatische Analyse
```bash
node debug-logs/analyze.js
```

Dies zeigt:
- Anzahl erfolgreich verarbeiteter Uploads
- Anzahl fehlgeschlagener Uploads
- Durchschnittliche Upload-Zeit
- Gesamt neue Items und Updates

### Manuell analysieren

1. Öffne eine Log-Datei:
```bash
cat debug-logs/upload_2026-03-31-12-45-30-XXX_test-file.txt.json | jq .
```

2. Spezifische Felder anschauen:
```bash
# Nur AI Response
jq .aiResponse debug-logs/upload_*.json

# Nur Ergebnis
jq .finalResult debug-logs/upload_*.json

# Nur Fehler
jq 'select(.error != null)' debug-logs/upload_*.json
```

## Häufige Debug-Szenarien

### 1. "Artikel werden nicht gemergt"
```bash
# Prüfe den aiResponse
jq '.aiResponse' debug-logs/upload_NEWEST.json

# Prüfe, ob die Items erkannt wurden
jq '.parsedResult.updates' debug-logs/upload_NEWEST.json
```

**Mögliche Ursachen:**
- AI erkannte Duplikate nicht
- JSON-Parsing-Fehler
- ID wird nicht korrekt übergeben

### 2. "Zu viele Items werden zusammengefasst"
```bash
# Prüfe die existierenden Items
jq '.existingItems' debug-logs/upload_NEWEST.json

# Vergleiche mit der erstellten Liste
```

**Mögliche Ursachen:**
- AI-Prompt ist zu großzügig mit Matching
- Fuzzy-Matching ist zu aggressiv

### 3. "Performance-Problem"
```bash
# Finde die langsamsten Uploads
jq '.durationMs' debug-logs/upload_*.json | sort -n | tail -5

# Prüfe Dateigröße
jq '{fileName: .fileName, fileSize: .fileSize, duration: .durationMs}' debug-logs/upload_*.json
```

### 4. "Parsing-Fehler"
```bash
# Finde Uploads mit Parsing-Problemen
jq 'select(.parsedResult.new == null or .parsedResult.updates == null)' debug-logs/upload_*.json

# Prüfe die AI Response
jq '.aiResponse' debug-logs/upload_*.json | head -100
```

## Debug-Tipps

### Prompt-Optimierung

Wenn die AI Items nicht richtig erkennt:

1. Öffne das Log
2. Prüfe den `aiPrompt`
3. Prüfe die `aiResponse`
4. Vergleiche mit den erwarteten Ergebnissen
5. Optimiere den Prompt in `src/app/api/upload-items/route.ts`

### Test-Durchlauf

```bash
# Starte die App
npm run dev

# Lade mehrere Test-Dateien hoch
# Jede erzeugt automatisch ein Log

# Analysiere die Ergebnisse
node debug-logs/analyze.js

# Bei Problemen: Prüfe spezifische Logs
jq . debug-logs/upload_PROBLEMATISCH.json
```

## Best Practices

1. **Nach jedem Upload prüfen:** `node debug-logs/analyze.js`
2. **Logs speichern:** Versionscontrolle der interessanten Logs
3. **Vergleichen:** Nach Prompt-Änderungen Vorher/Nachher vergleichen
4. **Pattern erkennen:** Schaue nach Mustern bei Fehlern

## Logs löschen

```bash
# Alle Logs löschen (Vorsicht!)
rm debug-logs/upload_*.json debug-logs/error_*.json

# Nur alte Logs (älter als 7 Tage)
find debug-logs -name "*.json" -type f -mtime +7 -delete
```

## Weitere Ressourcen

- **jq Dokumentation:** https://stedolan.github.io/jq/
- **Test-Dateien:** Siehe `stress-test-files/README.md`
- **Erwartete Ergebnisse:** `stress-test-files/*-expected.json`
