# Email Verification Setup - Anleitung

Das Email-Verifikationssystem funktioniert nicht, weil der Email-Provider im Supabase Dashboard nicht konfiguriert ist.

## 🚀 Schnelle Lösungen

### Option 1: Email Verification ausschalten (EMPFOHLEN für lokales Testing)

⚠️ **Das ist die empfohlene Option für lokale Entwicklung!**

**Problem**: Localhost ist nicht öffentlich erreichbar. Supabase kann keine Verification Emails mit funktionierenden Links versenden.

**Lösung**: Email Confirmation ausschalten:

1. Öffne Supabase Dashboard
2. Gehe zu: **Authentication → Providers → Email**
3. Unter "Email Confirmation Settings":
   - Deaktiviere: **"Require email confirmation"**
4. Speichern

**Ergebnis**: Benutzer können sich sofort nach Signup anmelden ohne Emailbestätigung. Perfect für lokales Testen!

---

### Option 1b: ngrok für Localhost Email Testing (fortgeschritten)

Wenn du Email Verification lokal testen willst:

```bash
brew install ngrok  # oder: npm install -g ngrok

# Expose localhost:3000
ngrok http 3000
# Output: https://abc123xyz.ngrok.io
```

Dann konfigurieren:
1. Supabase Dashboard → **Authentication → Providers → Email**
2. **Redirect URL**: `https://abc123xyz.ngrok.io/auth/callback`
3. Toggle **"Require email confirmation"** → **ON**
4. Speichern

Jetzt funktionieren Verification Emails lokal!

---

### Option 2: SendGrid aktivieren (für Production + Testing)

Das ist die empfohlen Option für Production, funktioniert aber auch lokal.

#### Schritt 1: SendGrid Account erstellen

1. Gehe zu: https://sendgrid.com
2. Klick "Sign up" 
3. Registriere dich kostenlos (100 Emails/Tag)
4. Email bestätigen
5. Login zu deinem SendGrid Account

#### Schritt 2: API Key generieren

1. Im SendGrid Dashboard:
   - Gehe zu: **Settings → API Keys**
   - Klick: **"Create API Key"**
   - Name: `supabase-einkaufsliste`
   - Permissions: **Full Access**
   - Erstelle Key
2. **Kopiere den API Key** (lange String)

#### Schritt 3: Supabase konfigurieren

1. Öffne dein Supabase Dashboard
2. Gehe zu: **Authentication → Email Providers**
3. Unter "Email Provider":
   - Wähle: **"SendGrid"**
   - Paste: **SendGrid API Key**
4. Unter "Email Settings":
   - **"From Email"**: `noreply@example.com` (oder deine Domain)
   - **"From Name"**: `Geteilte Einkaufsliste`
5. Speichern

#### Schritt 4: Email-Template prüfen

1. Gehe zu: **Authentication → Email Templates**
2. Überprüfe die Vorlage "Confirm signup"
3. Optional: Übersetze zu Deutsch

**Template sollte etwa so aussehen:**

```
Willkommen! Bitte bestätige deine E-Mail:

{{ .ConfirmationURL }}
```

#### Schritt 5: Testen

```bash
npm run dev
# Öffne http://localhost:3000/signup
# Registriere dich
# Du solltest eine Email von SendGrid erhalten
# Klick den Confirmation Link
# Du wirst zu /auth/callback weitergeleitet
```

---

## 🔍 Troubleshooting

### Fehler: "Email provider not configured"

**Ursache**: SendGrid API Key ist falsch oder nicht konfiguriert

**Lösung**:
1. Überprüfe den API Key in SendGrid
2. Stelle sicher, dass er kopiert wurde (ohne Leerzeichen)
3. Speichern im Supabase Dashboard

### Fehler: "Invalid redirect_to URL"

**Ursache**: URL Configuration ist falsch

**Lösung**:
1. Gehe zu: **Authentication → URL Configuration**
2. Überprüfe **Site URL**:
   - Lokal: `http://localhost:3000`
   - Production: `https://dein-domain.de`
3. Überprüfe **Redirect URLs**:
   - Sollte enthalten: `http://localhost:3000/auth/callback`
   - Sollte enthalten: `https://dein-domain.de/auth/callback`

### Emails werden nicht versendet

**Überprüfe Supabase Logs**:
1. Dashboard → **Authentication → Logs**
2. Versuche dich zu registrieren
3. Schaue nach Fehlern in den Logs

**Überprüfe SendGrid Logs**:
1. SendGrid Dashboard → **Mail Activity** oder **Activity**
2. Suche nach "bounce", "dropped" oder "delivered"

---

## 📧 Email Template auf Deutsch übersetzen

Optional: Passe das Email-Template auf Deutsch an

1. Supabase Dashboard → **Authentication → Email Templates**
2. Bei "Confirm signup" klick **"Edit"**
3. Übersetze den Text zu Deutsch:

```
Willkommen bei Geteilte Einkaufsliste!

Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren:

{{ .ConfirmationURL }}

Dieser Link ist 24 Stunden lang gültig.

Viele Grüße,
Das Team der Geteilten Einkaufsliste
```

4. **Speichern**

---

## ✅ Checkliste

Nach dem Setup sollte folgendes funktionieren:

- [ ] Supabase Dashboard: Authentication → Email Providers konfiguriert
- [ ] SendGrid: API Key erstellt und in Supabase eingegeben
- [ ] Supabase: Site URL und Redirect URLs konfiguriert
- [ ] Lokales Testing: `npm run dev` und Signup testen
- [ ] Email empfangen von deiner App
- [ ] Confirmation Link funktioniert
- [ ] Nach Bestätigung zur Home Page weitergeleitet

---

## 💡 Tipps

- **Test-Email**: Nutze deine eigene Email zum Testen
- **SendGrid Limits**: 100 Emails/Tag kostenlos
- **Production**: Für mehr als 100 Emails/Tag upgrade SendGrid
- **Alternative**: Mailgun, Postmark, oder andere Email Services funktionieren auch

---

## 📞 Support

Falls es nicht funktioniert:
1. Überprüfe Supabase Logs (Authentication → Logs)
2. Überprüfe SendGrid Activity
3. Lese die [Supabase Email Dokumentation](https://supabase.com/docs/guides/auth/auth-email)
