# Stress Test Files für Upload System

Dieser Ordner enthält verschiedene Testdateien, um das KI-Merge-System zu testen.

## Test-Kategorien

### 1. Einfache Tests
- `test-1-basic.txt` - Einfache Liste ohne Duplikate
- `test-2-duplicates.txt` - Liste mit offensichtlichen Duplikaten
- `test-3-variations.txt` - Produktvariationen (1L Milch, Vollmilch, etc.)

### 2. Edge Cases
- `test-4-quantities.txt` - Items mit bereits existierenden Mengenangaben
- `test-5-special-chars.txt` - Sonderzeichen, Umlaute, Emojis
- `test-6-mixed-language.txt` - Deutsch/Englisch gemischt
- `test-7-long-names.txt` - Sehr lange Produktnamen
- `test-8-empty-lines.txt` - Leerzeilen und Whitespace

### 3. Stress Tests
- `test-9-large-list.txt` - 100+ Items
- `test-10-fuzzy-matching.txt` - Testen der "großzügigen" Duplikaterkennung
- `test-11-categories.txt` - Items aus allen Kategorien

### 4. Realistische Szenarien
- `test-12-handwritten.txt` - Simuliert handschriftliche OCR-Fehler
- `test-13-recipe.txt` - Rezept mit Mengen und Zutaten
- `test-14-shopping-note.txt` - Notiz-Stil mit unstrukturiertem Text

## Debug Logs

Nach jedem Upload wird automatisch ein Log in `/debug-logs/` erstellt mit:
- Timestamp
- Original-Dateiname
- Dateigröße
- Aktuelle Liste (mit IDs)
- AI Prompt
- AI Response (roh)
- Geparstes Ergebnis
- Finale Statistiken
- Laufzeit in ms

## Nutzung

1. Erstelle eine leere Liste oder verwende eine existierende
2. Lade die Testdateien nacheinander hoch
3. Überprüfe die Ergebnisse
4. Prüfe die Debug-Logs in `/debug-logs/`
5. Identifiziere Probleme und optimiere die AI-Prompts

## Erwartete Ergebnisse

Jede Testdatei hat eine `*-expected.json` Datei mit den erwarteten Ergebnissen.
