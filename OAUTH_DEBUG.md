# OAuth Provider Debugging

Falls die OAuth-Provider immer noch nicht funktionieren, folge dieser Debugging-Anleitung.

## 🔍 Überprüfungsliste

### 1. Überprüfe deine Environment Variablen

Stelle sicher, dass diese in `.env.local` gesetzt sind:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.com  # oder http://localhost:3000 lokal
```

Check:
```bash
cat .env.local | grep NEXT_PUBLIC
```

### 2. Überprüfe die Supabase Konfiguration

```sql
-- Gehe zu Supabase SQL Editor und führe aus:
SELECT * FROM auth.identities LIMIT 1;
```

Dies zeigt dir, welche Auth Provider konfiguriert sind.

### 3. Überprüfe die Browser Console

Öffne die Dev Tools (F12) in deinem Browser und schaue nach Fehlern:
- Network Tab: Überprüfe den `/auth/callback` Request
- Console Tab: Schaue nach JavaScript Errors

### 4. Überprüfe Supabase Logs

1. Gehe zu Supabase Dashboard
2. Wähle dein Projekt
3. Gehe zu "Authentication" → "Logs"
4. Versuche, dich anzumelden und schaue nach Fehlern

---

## 🛠️ Häufige Fehler und Lösungen

### Fehler: "invalid_client"
**Ursache**: Client ID ist falsch oder nicht konfiguriert
**Lösung**:
1. Gehe zu Supabase → "Authentication" → "Providers"
2. Überprüfe, dass der Provider aktiviert ist
3. Überprüfe Client ID und Secret (keine Leerzeichen!)
4. Starte den Dev Server neu

### Fehler: "invalid_request: redirect_uri_mismatch"
**Ursache**: Redirect-URI stimmt nicht überein
**Lösung**:
1. In Google Cloud/GitHub/Apple überprüfe die Redirect URI:
   ```
   https://<dein-supabase-projekt>.supabase.co/auth/v1/callback
   ```
2. In Supabase → "Authentication" → "URL Configuration" setze:
   - Site URL: `http://localhost:3000` (lokal) oder `https://dein-domain.de`
   - Redirect URLs: sollten automatisch konfiguriert sein

### Fehler: "CORS error"
**Ursache**: CORS Policy blockiert den Request
**Lösung**:
1. Überprüfe deine Supabase URL in `.env.local`
2. Stelle sicher, dass die URL mit `https://` beginnt (nicht `http://`)
3. Leere deinen Browser Cache (Ctrl+Shift+Delete)

### Fehler: "Something went wrong"
**Ursache**: Generischer Fehler, meist ein Configuration Issue
**Lösung**:
1. Überprüfe die Supabase Logs
2. Überprüfe die Browser Console für Details
3. Starte den Dev Server neu: `Ctrl+C` und `npm run dev`

---

## 🚀 Schritt-für-Schritt Debugging

### Schritt 1: Test mit Email/Passwort

Versuche zuerst, dich mit Email und Passwort anzumelden:
1. Gehe zu http://localhost:3000/signup
2. Registriere dich mit Email und Passwort
3. Bestätige deine Email
4. Versuche dich anzumelden

Falls dies nicht funktioniert, liegt das Problem nicht bei OAuth.

### Schritt 2: Test mit Google

1. Öffne http://localhost:3000/login
2. Klicke "Anmelden mit Google"
3. Du solltest zu Google weitergeleitet werden
4. Nach Login solltest du zu `/auth/callback` geleitet werden
5. Dann solltest du zur Home Page geleitet werden

**Browser Console Fehler?**
- Öffne F12 → Network Tab
- Klicke "Anmelden mit Google"
- Überprüfe die Requests in der Network Tab
- Suche nach 401, 403 oder 500 Fehlern

### Schritt 3: Test mit GitHub

Gleich wie Google, aber nutze GitHub statt Google.

### Schritt 4: Test mit Apple

⚠️ Apple funktioniert nur auf HTTPS!
- Lokal brauchst du einen HTTPS Tunnel oder ngrok:
  ```bash
  ngrok http 3000
  ```
- Nutze die ngrok URL in Supabase Site URL

---

## 📊 Supabase Logs überprüfen

1. Gehe zu https://app.supabase.com
2. Wähle dein Projekt
3. Gehe zu "Authentication" → "Logs"
4. Scrolle nach unten um neue Logs zu sehen
5. Suche nach Fehlern oder "Failed" Einträgen

**Typische Log Einträge**:
- ✅ `Successful sign in`
- ✅ `OAuth provider: google`
- ❌ `Failed: invalid_client`
- ❌ `Failed: redirect_uri_mismatch`

---

## 🔐 Testing mit curl (Fortgeschrittene)

Du kannst die OAuth Flow auch mit curl testen:

```bash
# 1. Hole die OAuth URL
curl -X POST \
  -H "apikey: your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"provider":"google"}' \
  https://your-project.supabase.co/auth/v1/signin?redirect_to=http://localhost:3000/auth/callback

# Dies sollte eine URL mit einem code Parameter zurückgeben
# Du kannst dann den Code in der Browser URL sehen
```

---

## ✅ Finale Checkliste

Nach dem Debuggen:

- [ ] `.env.local` hat alle erforderlichen Variablen
- [ ] Supabase Dashboard hat OAuth Provider konfiguriert
- [ ] Client IDs und Secrets sind korrekt eingegeben
- [ ] Redirect URIs sind korrekt in allen Services
- [ ] Supabase Site URL ist gesetzt
- [ ] Dev Server wurde neu gestartet nach Änderungen
- [ ] Browser Cache wurde geleert
- [ ] Mit email/passwort kann man sich anmelden
- [ ] Mit Google kann man sich anmelden (oder getestet)
- [ ] Mit GitHub kann man sich anmelden (oder getestet)

---

## 📞 Support

Falls es immer noch nicht funktioniert:
1. Überprüfe die [Supabase OAuth Dokumentation](https://supabase.com/docs/guides/auth/oauth2)
2. Schau dir die [Provider Konfiguration](./OAUTH_PROVIDERS_SETUP.md) an
3. Überprüfe die Supabase Community [Discord](https://discord.supabase.io)
