# OAuth Provider Setup - Schritt für Schritt Anleitung

Die OAuth-Provider (Google, GitHub, Apple) funktionieren noch nicht, weil sie im Supabase Dashboard konfiguriert werden müssen.

## 🚀 Schnellanleitung

### 1. Google OAuth Setup

#### Google Cloud Console
1. Gehe zu https://console.cloud.google.com/
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Gehe zu "APIs & Services" → "Credentials"
4. Klicke auf "Create Credentials" → "OAuth 2.0 Client ID"
5. Wähle "Web application"
6. Unter "Authorized redirect URIs" füge hinzu:
   ```
   https://<dein-supabase-projekt>.supabase.co/auth/v1/callback
   ```
7. Kopiere deine **Client ID** und **Client Secret**

#### Supabase Dashboard
1. Gehe zu https://app.supabase.com
2. Wähle dein Projekt → "Authentication"
3. Klick auf "Providers"
4. Aktiviere "Google"
5. Füge die **Client ID** und **Client Secret** ein
6. Speichern

---

### 2. GitHub OAuth Setup

#### GitHub Settings
1. Gehe zu https://github.com/settings/developers
2. Wähle "OAuth Apps" → "New OAuth App"
3. Fülle das Formular aus:
   - **Application name**: Geteilte Einkaufsliste
   - **Homepage URL**: `https://dein-domain.de`
   - **Authorization callback URL**:
     ```
     https://<dein-supabase-projekt>.supabase.co/auth/v1/callback
     ```
4. Kopiere **Client ID** und generiere **Client Secret**

#### Supabase Dashboard
1. Gehe zu "Authentication" → "Providers"
2. Aktiviere "GitHub"
3. Füge **Client ID** und **Client Secret** ein
4. Speichern

---

### 3. Apple OAuth Setup

#### Apple Developer Program
⚠️ **Voraussetzung**: Apple Developer Program Mitgliedschaft ($99/Jahr)

1. Gehe zu https://developer.apple.com/
2. Melde dich an oder erstelle einen Account
3. Gehe zu "Certificates, Identifiers & Profiles"
4. Erstelle eine neue "App ID" für deine App
5. Aktiviere "Sign in with Apple"
6. Erstelle einen "Service ID" für deine Web App
7. Konfiguriere "Sign in with Apple":
   - **Domains and Subdomains**: `dein-supabase-projekt.supabase.co`
   - **Return URLs**: 
     ```
     https://dein-supabase-projekt.supabase.co/auth/v1/callback
     ```
8. Erstelle einen "Private Key" für Apple Sign in
9. Lade die Private Key Datei herunter

#### Supabase Dashboard
1. Gehe zu "Authentication" → "Providers"
2. Aktiviere "Apple"
3. Füge die erforderlichen Credentials ein:
   - **Client ID**: Deine Service ID
   - **Team ID**: Aus deinem Apple Developer Account
   - **Key ID**: Aus der Private Key Datei
   - **Private Key**: Inhalt der heruntergeladenen Datei
4. Speichern

---

## 🔧 Supabase URL Konfiguration

Nach dem Hinzufügen der Provider musst du noch die "Site URL" konfigurieren:

1. Gehe zu "Authentication" → "URL Configuration"
2. Setze die **Site URL**:
   ```
   https://dein-domain.de
   ```
   (Lokal: `http://localhost:3000`)
3. Unter "Redirect URLs" sollte automatisch eingetragen sein:
   ```
   http://localhost:3000/auth/callback
   ```

---

## 🧪 Testen

Nach der Konfiguration:

1. Starte deinen Dev Server:
   ```bash
   npm run dev
   ```

2. Öffne http://localhost:3000/login

3. Versuche, dich mit einem OAuth Provider anzumelden

4. Du solltest zur Provider-Anmeldungsseite weitergeleitet werden

5. Nach erfolgreicher Anmeldung wirst du zu `/auth/callback` weitergeleitet

6. Du solltest dann zur Home Page geleitet werden

---

## 🐛 Troubleshooting

### "Invalid redirect_uri"
- Überprüfe, dass die Redirect-URIs in allen Services korrekt sind:
  ```
  https://<dein-supabase-projekt>.supabase.co/auth/v1/callback
  ```

### "Client ID mismatch"
- Stelle sicher, dass die Client IDs und Secrets korrekt kopiert wurden
- Keine Leerzeichen am Anfang/Ende!

### Lokales Testing funktioniert nicht
- Setze in Supabase:
  - **Site URL**: `http://localhost:3000`
  - **Redirect URLs**: `http://localhost:3000/auth/callback`

### Apple Provider wird nicht angezeigt
- Überprüfe, dass du Apple Developer Program Mitglied bist
- Apple benötigt einige zusätzliche Konfiguration

---

## 📋 Checkliste

- [ ] Google OAuth konfiguriert
- [ ] GitHub OAuth konfiguriert
- [ ] Apple OAuth konfiguriert (optional)
- [ ] Supabase Site URL gesetzt
- [ ] Redirect URLs konfiguriert
- [ ] Lokal getestet mit `npm run dev`
- [ ] Mit jedem Provider angemeldet testen

---

## 🔐 Sicherheit

- **Niemals** Client Secrets in den Client-Code committen
- Alle Secrets sind nur serverseitig in Supabase gespeichert
- OAuth Flow ist sicher, da Tokens nur auf dem Server verarbeitet werden

---

## 📖 Weitere Ressourcen

- [Supabase OAuth Dokumentation](https://supabase.com/docs/guides/auth/oauth2)
- [Google OAuth Dokumentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Dokumentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Apple OAuth Dokumentation](https://developer.apple.com/documentation/authenticationservices)

---

Nach Abschluss dieser Schritte sollten alle OAuth Provider funktionieren! 🎉
