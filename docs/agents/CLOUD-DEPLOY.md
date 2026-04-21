# Cloud Deploy Agent – Příprava cloudového nasazení (Rael School)

> Spusť, až budeš chtít nasadit aplikaci na internet (sponzoři, dobrovolníci, management mimo lokál).
> Agent analyzuje stav, doporučí platformu a připraví plán.

---

## Kontext projektu

- **Stack:** Next.js 14 (App Router) + TypeScript + Prisma + SQLite + Tailwind
- **Autentizace:** JWT v httpOnly cookies
- **Data:** SQLite file `prisma/dev.db` (~148 studentů, 137 sponzorů)
- **Nahrávání:** Fotografie studentů, importy bank výpisů (CSV/XLSX)
- **Lokalizace:** Vlastní i18n (cs/en/sw)
- **Aktuální způsob provozu:** `npm run dev` lokálně, žádný produkční server

---

## Cíl

Připravit Rael School pro nasazení na cloud tak, aby:
- Sponzoři měli přístup k detailům svých studentů přes internet
- Management měl centralizovanou instanci
- Zálohy běžely automaticky
- Data byla bezpečná (HTTPS, auth, rate limit)

**NEPRAV ŽÁDNÝ KÓD. ANALYZUJ A DOPORUČ.**

---

## Fáze 1: ANALÝZA PŘIPRAVENOSTI

### 1.1 Konfigurovatelnost
Co je hardcoded vs přes env:
- `DATABASE_URL` v `.env`? ✅
- `JWT_SECRET` přes env? (ověř v `src/lib/auth.ts`)
- Cesty k souborům (upload dir pro fotografie) — konfigurovatelné?
- URL aplikace (pro cookie domain)?
- SMTP (pokud bude email pro reset hesla)?

### 1.2 Bezpečnost pro internet
| Kontrola | Kde |
|----------|------|
| Autentizace | `src/lib/auth.ts` |
| CSRF ochrana | `src/lib/csrf.ts` |
| Rate limiting | `src/lib/rateLimit.ts` |
| CSP, HSTS headers | `next.config.js` |
| Secure cookies v produkci | `src/lib/auth.ts` — `secure: process.env.NODE_ENV === 'production'` |
| Debug mode vypnutý | `NODE_ENV=production` |

### 1.3 Výkon pro víceuživatelský přístup
- **SQLite:**
  - WAL mode? (ověř `PRAGMA journal_mode`)
  - Concurrent reads OK, concurrent writes sekvenční — pro ~30 uživatelů stačí
- **Session:** JWT v cookie = stateless, OK
- **File uploads:** Fotografie — kam se ukládají? Persistent volume nutný

### 1.4 Next.js specifika
- **Build output:** Přidat `output: 'standalone'` do `next.config.js` pro Docker
- **API routes:** Běží na Node runtime (ne edge) kvůli Prisma klientu
- **Image optimization:** `next/image` vyžaduje runtime (ne static export)

---

## Fáze 2: DOPORUČENÍ PLATFORMY

Hlavní rozhodnutí: **jak řešit persistent storage pro SQLite + uploads.**

### Varianta A: VPS (doporučeno pro jednoduchost)

| Atribut | |
|---------|-|
| **Kdy** | Plná kontrola, SQLite zůstává, nízký provoz |
| **Příklady** | Hetzner Cloud (~€5/měs), Contabo, Wedos VPS |
| **Stack** | Ubuntu 22.04 + Node 20 + systemd + nginx + Let's Encrypt |
| **Cena** | 100–250 Kč/měs |
| **Pro** | SQLite funguje přímo, levné |
| **Proti** | Ruční správa (updates, zálohy, monitoring) |

### Varianta B: Railway (doporučeno pro minimální ops)

| Atribut | |
|---------|-|
| **Kdy** | Nechceš spravovat server, deploy na git push |
| **Stack** | Dockerfile / Nixpacks + persistent volume |
| **Cena** | ~$5/měs base + usage (~150–400 Kč/měs) |
| **Pro** | Auto HTTPS, persistent volumes |
| **Proti** | Vendor lock-in, dražší při růstu |

### Varianta C: Fly.io

| Atribut | |
|---------|-|
| **Kdy** | Chceš edge + persistent volume |
| **Stack** | Dockerfile + Fly volumes |
| **Cena** | ~$3–10/měs (free tier pro malé app) |
| **Pro** | Dobrý DX, volumes |
| **Proti** | Složitější konfigurace |

### Varianta D: Vercel (NEDOPORUČUJEME)

| Atribut | |
|---------|-|
| **Problém** | SQLite nefunguje (ephemeral FS) |
| **Kdy** | Jen při migraci na Postgres / Turso (libSQL) |
| **Proti** | Migrace DB = kus práce, známé edge cases s Prisma |

### Varianta E: Self-hosted Docker

| Atribut | |
|---------|-|
| **Kdy** | Vlastní HW (home server, NAS) |
| **Stack** | docker-compose + traefik/caddy + volumes |
| **Pro** | Žádné měsíční náklady |
| **Proti** | Vyžaduje public IP / tunel (Cloudflare Tunnel, Tailscale) |

---

## Fáze 3: PŘÍPRAVA NASAZENÍ

### 3.1 Dockerfile (pro Docker / Railway / Fly)

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

**Předpoklad:** `next.config.js` má `output: 'standalone'`.

### 3.2 Environment variables

```bash
DATABASE_URL=file:/data/rael.db       # persistent volume cesta
JWT_SECRET=<random 64+ chars>          # openssl rand -base64 64
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
# Pokud bude email:
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

### 3.3 Healthcheck endpoint

Přidej `src/app/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ status: 'ok' })
}
```

### 3.4 Produkční nastavení

`next.config.js`:
- `output: 'standalone'`
- CSP headers
- `reactStrictMode: true`

`src/lib/auth.ts` (cookie options):
- `secure: process.env.NODE_ENV === 'production'`
- `sameSite: 'lax'` (nebo `'strict'` bez cross-site navigace)
- `httpOnly: true`

### 3.5 Zálohy v cloudu

Týdenní cron (nebo denní), kopíruje SQLite do object storage (S3, Backblaze B2, Cloudflare R2):

```bash
#!/bin/bash
# /etc/cron.weekly/rael-backup
DATE=$(date +%Y%m%d)
sqlite3 /data/rael.db ".backup /tmp/rael-$DATE.db"
aws s3 cp /tmp/rael-$DATE.db s3://rael-backups/
rm /tmp/rael-$DATE.db
```

Alternativa: **Litestream** pro kontinuální SQLite replikaci.

### 3.6 VPS-specifické

**Nginx** (`/etc/nginx/sites-available/rael`):
```nginx
server {
  listen 443 ssl http2;
  server_name rael.example.com;
  ssl_certificate /etc/letsencrypt/live/rael.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/rael.example.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}
```

**systemd** (`/etc/systemd/system/rael.service`):
```ini
[Unit]
Description=Rael School
After=network.target

[Service]
Type=simple
User=rael
WorkingDirectory=/opt/rael
ExecStart=/usr/bin/node server.js
Restart=always
EnvironmentFile=/opt/rael/.env

[Install]
WantedBy=multi-user.target
```

**Let's Encrypt:** `certbot --nginx -d rael.example.com`
**Firewall (ufw):** 22 (SSH), 80, 443

---

## Fáze 4: CHECKLIST NASAZENÍ

- [ ] `next.config.js` má `output: 'standalone'`
- [ ] `/api/health` endpoint existuje
- [ ] `JWT_SECRET` je náhodný (ne default)
- [ ] HTTPS funguje
- [ ] HTTP → HTTPS redirect
- [ ] Secure cookies v produkci
- [ ] Rate limiting na login a importech
- [ ] CSP headers
- [ ] Persistent volume pro `dev.db` a uploads
- [ ] Zálohy do object storage (cron nastavený)
- [ ] Monitoring (aspoň uptime — UptimeRobot zdarma)
- [ ] Testováno: login (všechny role), CRUD, import, export, tisk, dark mode, lokalizace
- [ ] DNS směřuje na server
- [ ] `.env` neobsahuje lokální cesty ani default secrety

---

## Fáze 5: REPORT

Vytvoř `CLOUD-DEPLOY-REPORT.md`:

```markdown
# Rael School – Cloud Deploy Report – YYYY-MM-DD

## Analýza připravenosti
| Kontrola | Stav | Poznámka |
|----------|------|----------|
| Autentizace | ✅/❌ | ... |
| HTTPS ready | ✅/❌ | ... |
| Konfigurovatelnost | ✅/❌ | Co je hardcoded |
| Bezpečnost | ✅/❌ | ... |
| Performance | ✅/⚠️/❌ | SQLite limit ~30 current users |

## Doporučená platforma
**[Varianta X]** — [důvod]

## Potřebné změny v kódu
| # | Změna | Soubor | Složitost |
|---|-------|--------|-----------|
| 1 | Přidat `output: 'standalone'` | `next.config.js` | nízká |
| 2 | Přidat `/api/health` | `src/app/api/health/route.ts` | nízká |

## Odhad nákladů
- Hosting: X Kč/měs
- Doména: X Kč/rok
- Object storage (zálohy): X Kč/měs
- SSL: zdarma (Let's Encrypt nebo managed)
- **Celkem: X Kč/měs**

## Postup nasazení
1. [krok]
2. [krok]

## Rizika
- [potenciální problémy — např. migrace SQLite→Postgres pokud Vercel]
```

---

## Spuštění

```
Přečti docs/agents/CLOUD-DEPLOY.md a analyzuj připravenost pro cloud. Doporuč platformu a připrav plán.
```
