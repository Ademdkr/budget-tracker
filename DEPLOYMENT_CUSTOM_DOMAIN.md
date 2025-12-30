# Custom Domain Setup für Budget Tracker

Anleitung zur Konfiguration von `budget-tracker.ademdokur.dev` für das auf Cloudflare deployete Budget-Tracker-Projekt.

## Übersicht

- **Frontend**: `budget-tracker.ademdokur.dev`
- **Backend API**: `api.budget-tracker.ademdokur.dev`
- **Datenbank**: Neon PostgreSQL (bereits konfiguriert)
- **Hosting**: Cloudflare Pages (Frontend) + Cloudflare Workers (Backend)

---

## Schritt 1: Cloudflare Dashboard - DNS-Einträge erstellen

1. Öffne [dash.cloudflare.com](https://dash.cloudflare.com)
2. Wähle deine Domain **ademdokur.dev**
3. Navigiere zu **DNS** → **Records**
4. Erstelle folgende DNS-Einträge:

### Frontend DNS-Eintrag

```
Type:   CNAME
Name:   budget-tracker
Target: <dein-pages-projekt>.pages.dev
Proxy:  Proxied (Orange Cloud aktiv)
TTL:    Auto
```

> **Hinweis**: Den genauen Pages-Projektnamen findest du unter _Workers & Pages_ → _Dein Frontend-Projekt_

### Backend API DNS-Eintrag

```
Type:   CNAME
Name:   api.budget-tracker
Target: budget-tracker-backend-prod.<dein-account>.workers.dev
Proxy:  Proxied (Orange Cloud aktiv)
TTL:    Auto
```

> **Hinweis**: Den Worker-Namen findest du in `apps/backend/wrangler.toml` unter `[env.production].name`

---

## Schritt 2: Custom Domains in Cloudflare hinzufügen

### 2.1 Frontend (Cloudflare Pages)

1. Gehe zu **Workers & Pages**
2. Wähle dein **Frontend-Projekt** aus
3. Navigiere zu **Settings** → **Custom domains**
4. Klicke auf **Set up a custom domain**
5. Gebe ein: `budget-tracker.ademdokur.dev`
6. Klicke auf **Activate domain**

> Die DNS-Verifizierung erfolgt automatisch, wenn der CNAME-Eintrag korrekt ist.

### 2.2 Backend (Cloudflare Worker)

1. Gehe zu **Workers & Pages**
2. Wähle deinen **Backend-Worker** aus (z.B. `budget-tracker-backend-prod`)
3. Navigiere zu **Settings** → **Triggers** → **Custom Domains**
4. Klicke auf **Add Custom Domain**
5. Gebe ein: `api.budget-tracker.ademdokur.dev`
6. Klicke auf **Add Custom Domain**

---

## Schritt 3: Environment Variables setzen

### 3.1 CORS_ORIGIN für Backend Worker

Öffne ein Terminal und navigiere zum Backend-Verzeichnis:

```bash
cd apps/backend
```

Setze die CORS_ORIGIN Environment Variable für Production:

```bash
wrangler secret put CORS_ORIGIN --env production
```

Wenn du nach dem Wert gefragt wirst, gebe ein:

```
https://budget-tracker.ademdokur.dev
```

**Optional**: Falls du mehrere Origins erlauben möchtest (z.B. auch localhost für Tests):

```
https://budget-tracker.ademdokur.dev,http://localhost:4201
```

### 3.2 Weitere Secrets verifizieren

Stelle sicher, dass folgende Secrets gesetzt sind:

```bash
# DATABASE_URL überprüfen/setzen
wrangler secret put DATABASE_URL --env production
# Gebe deine Neon PostgreSQL Connection String ein

# JWT_SECRET überprüfen/setzen
wrangler secret put JWT_SECRET --env production
# Gebe einen sicheren JWT Secret ein

# Alle Secrets anzeigen
wrangler secret list --env production
```

---

## Schritt 4: Code-Änderungen deployen

Die API-URL im Frontend wurde bereits aktualisiert. Jetzt committen und pushen:

```bash
# Status prüfen
git status

# Änderungen stagen
git add apps/frontend/src/environments/environment.ts

# Commit erstellen
git commit -m "feat: update production API URL to custom domain"

# Pushen (löst automatisch CD-Pipeline aus)
git push origin main
```

---

## Schritt 5: Deployment verifizieren

### 5.1 GitHub Actions überwachen

1. Gehe zu deinem GitHub Repository
2. Navigiere zu **Actions**
3. Beobachte den laufenden Workflow
4. Warte bis alle Jobs erfolgreich sind (✓)

### 5.2 Cloudflare Deployments prüfen

1. Öffne [dash.cloudflare.com](https://dash.cloudflare.com)
2. Gehe zu **Workers & Pages**
3. Prüfe beide Deployments:
   - Frontend (Pages)
   - Backend (Worker)

---

## Schritt 6: Custom Domains testen

### 6.1 DNS-Propagation prüfen

```bash
# Frontend
nslookup budget-tracker.ademdokur.dev

# Backend API
nslookup api.budget-tracker.ademdokur.dev
```

> **Hinweis**: DNS-Änderungen können 1-5 Minuten dauern.

### 6.2 Funktionalität testen

1. **Frontend**: Öffne [https://budget-tracker.ademdokur.dev](https://budget-tracker.ademdokur.dev)
   - Sollte die Budget Tracker Anwendung anzeigen
2. **Backend API**: Teste [https://api.budget-tracker.ademdokur.dev/health](https://api.budget-tracker.ademdokur.dev/health)
   - Sollte einen Health-Check Response zurückgeben

3. **Login-Flow testen**:
   - Öffne die App
   - Versuche dich einzuloggen/zu registrieren
   - Prüfe ob API-Calls funktionieren (DevTools → Network)

---

## Schritt 7: SSL/TLS verifizieren

1. Öffne [https://budget-tracker.ademdokur.dev](https://budget-tracker.ademdokur.dev)
2. Klicke auf das Schloss-Symbol in der Adressleiste
3. Verifiziere, dass ein gültiges SSL-Zertifikat vorhanden ist
4. Wiederhole für [https://api.budget-tracker.ademdokur.dev](https://api.budget-tracker.ademdokur.dev)

> **Cloudflare** stellt automatisch kostenlose SSL-Zertifikate bereit.

---

## Troubleshooting

### Problem: "DNS_PROBE_FINISHED_NXDOMAIN"

**Lösung**:

- DNS-Einträge in Cloudflare nochmal prüfen
- 5-10 Minuten warten (DNS-Propagation)
- Browser-Cache leeren (`Ctrl + Shift + Del`)

### Problem: "CORS Error" in Browser Console

**Lösung**:

```bash
# CORS_ORIGIN nochmal setzen
cd apps/backend
wrangler secret put CORS_ORIGIN --env production
# Wert: https://budget-tracker.ademdokur.dev

# Worker neu deployen
git commit --allow-empty -m "redeploy: trigger worker deployment"
git push
```

### Problem: API-Calls schlagen fehl (404/500)

**Lösung**:

1. Backend Worker Logs prüfen:
   ```bash
   wrangler tail --env production
   ```
2. Environment Variables verifizieren:
   ```bash
   wrangler secret list --env production
   ```
3. DATABASE_URL prüfen (muss gültige Neon Connection String sein)

### Problem: Custom Domain zeigt "Not Found"

**Lösung**:

- In Cloudflare Dashboard prüfen ob Custom Domain aktiviert ist
- DNS-Einträge verifizieren
- Deployment-Status in Cloudflare prüfen
- Ggf. Custom Domain entfernen und neu hinzufügen

---

## Checkliste

Verwende diese Checkliste um sicherzustellen, dass alles konfiguriert ist:

- [ ] DNS CNAME für `budget-tracker` erstellt
- [ ] DNS CNAME für `api.budget-tracker` erstellt
- [ ] Custom Domain für Frontend in Cloudflare Pages hinzugefügt
- [ ] Custom Domain für Backend in Cloudflare Workers hinzugefügt
- [ ] `CORS_ORIGIN` Secret gesetzt
- [ ] `DATABASE_URL` Secret gesetzt
- [ ] `JWT_SECRET` Secret gesetzt
- [ ] Code-Änderungen committed und gepusht
- [ ] GitHub Actions Deployment erfolgreich
- [ ] Frontend unter `budget-tracker.ademdokur.dev` erreichbar
- [ ] Backend unter `api.budget-tracker.ademdokur.dev` erreichbar
- [ ] SSL-Zertifikate aktiv
- [ ] Login-Flow funktioniert
- [ ] API-Calls funktionieren ohne CORS-Fehler

---

## Nützliche Befehle

```bash
# Cloudflare Worker Logs live anzeigen
wrangler tail --env production

# Secrets verwalten
wrangler secret list --env production
wrangler secret put <SECRET_NAME> --env production
wrangler secret delete <SECRET_NAME> --env production

# Manuelles Deployment (falls nötig)
cd apps/backend
wrangler deploy --env production

# Lokaler Test
pnpm dev:backend
pnpm dev:frontend
```

---

## Weitere Ressourcen

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Custom Domains Setup](https://developers.cloudflare.com/pages/platform/custom-domains/)
- [Neon PostgreSQL Docs](https://neon.tech/docs/introduction)

---

## Support

Bei Problemen:

1. Prüfe die Cloudflare Worker Logs
2. Schaue in die GitHub Actions Logs
3. Verifiziere alle Environment Variables
4. Teste API-Endpoints direkt (Postman/curl)

**Viel Erfolg mit deinem Deployment! 🚀**
