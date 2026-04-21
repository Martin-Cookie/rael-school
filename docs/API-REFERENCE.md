# API Reference

> **Base URL:** `/api`
> **Auth:** Všechny endpointy vyžadují JWT token v httpOnly cookie `auth-token` (kromě `/api/auth/login`).
> **CSRF:** Mutující metody (POST/PUT/DELETE/PATCH) vyžadují header `x-csrf-token` shodný s cookie `csrf-token` (viz `src/middleware.ts` a `src/lib/fetchWithCsrf.ts`). Výjimka: `/auth/login` (teprve nastavuje cookie).

### Chybové kódy

| Status | Význam |
|--------|--------|
| 400 | Chybný požadavek (chybějící pole, neplatná data) |
| 401 | Nepřihlášen nebo nedostatečná oprávnění |
| 403 | CSRF token mismatch nebo nedostatečná role |
| 404 | Záznam nenalezen |
| 409 | Konflikt (duplicita) |
| 429 | Příliš mnoho požadavků (rate limit) |
| 500 | Interní chyba serveru |

---

## Autentizace

| Metoda | Endpoint | Popis | Role | Rate limit |
|--------|----------|-------|------|-----------|
| POST | `/auth/login` | Přihlášení (email + heslo), vrací cookie | public | 5 / 15 min per IP+email |
| POST | `/auth/logout` | Odhlášení, smaže cookie | * | — |
| GET | `/auth/me` | Profil přihlášeného uživatele | * | 120 / min per IP |

**Příklad — POST `/auth/login`:**
```json
// Request
{ "email": "admin@rael.school", "password": "admin123" }

// Response 200
{ "user": { "id": "...", "email": "admin@rael.school", "firstName": "Admin", "lastName": "RAEL", "role": "ADMIN" } }

// Response 401
{ "error": "Invalid credentials" }
```

---

## Studenti

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| GET | `/students` | Seznam aktivních studentů (query: `search`, `class`) | * |
| POST | `/students` | Nový student (auto-generuje `studentNo`) | ADMIN, MANAGER, VOLUNTEER |
| GET | `/students/[id]` | Detail studenta | * (SPONSOR jen své) |
| PUT | `/students/[id]` | Úprava studenta | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/students/[id]` | Soft delete (isActive=false) | ADMIN |

### Sub-resources studenta

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| POST | `/students/[id]/profile-photo` | Upload profilové fotky | ADMIN, MANAGER, VOLUNTEER |
| POST | `/students/[id]/photos` | Upload fotky (magic byte validace) | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/students/[id]/photos` | Smazání fotky | ADMIN, MANAGER, VOLUNTEER |
| POST | `/students/[id]/health` | Přidání zdravotní prohlídky | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/students/[id]/health` | Smazání zdravotní prohlídky | ADMIN, MANAGER, VOLUNTEER |
| POST | `/students/[id]/equipment` | Přidání vybavení (jednotlivě/hromadně) | ADMIN, MANAGER, VOLUNTEER |
| PUT | `/students/[id]/equipment` | Úprava vybavení | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/students/[id]/equipment` | Smazání vybavení | ADMIN, MANAGER, VOLUNTEER |
| POST | `/students/[id]/needs` | Přidání potřeby | ADMIN, MANAGER, VOLUNTEER |
| PUT | `/students/[id]/needs` | Úprava potřeby (splnění) | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/students/[id]/needs` | Smazání potřeby | ADMIN, MANAGER, VOLUNTEER |
| POST | `/students/[id]/wishes` | Přidání přání | ADMIN, MANAGER, VOLUNTEER |
| PUT | `/students/[id]/wishes` | Úprava přání | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/students/[id]/wishes` | Smazání přání | ADMIN, MANAGER, VOLUNTEER |
| POST | `/students/[id]/vouchers` | Přidání nákupu stravenek | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/students/[id]/vouchers` | Smazání nákupu stravenek | ADMIN, MANAGER, VOLUNTEER |
| POST | `/students/[id]/sponsor-payments` | Přidání sponzorské platby | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/students/[id]/sponsor-payments` | Smazání sponzorské platby | ADMIN, MANAGER, VOLUNTEER |
| POST | `/students/[id]/sponsors` | Přidání sponzorství (vytvoří sponzora pokud neexistuje) | ADMIN, MANAGER, VOLUNTEER |
| PUT | `/students/[id]/sponsors` | Úprava sponzorství | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/students/[id]/sponsors` | Ukončení sponzorství | ADMIN, MANAGER, VOLUNTEER |

---

## Sponzoři

| Metoda | Endpoint | Popis | Role | Rate limit |
|--------|----------|-------|------|-----------|
| GET | `/sponsors` | Seznam sponzorů (query: `search`, `active`) | ADMIN, MANAGER, VOLUNTEER | — |
| POST | `/sponsors` | Nový sponzor (náhodné heslo) | ADMIN, MANAGER, VOLUNTEER | 20 / min per user |
| GET | `/sponsors/[id]` | Detail sponzora s vazbami | * | — |
| PUT | `/sponsors/[id]` | Úprava sponzora | ADMIN, MANAGER, VOLUNTEER | — |
| PATCH | `/sponsors/[id]` | Toggle aktivní/neaktivní (kaskáda na sponzorství) | ADMIN, MANAGER | — |
| GET | `/sponsors/search` | Autocomplete hledání (top 10, query: `q`) | * | 30 / min per user |
| GET | `/sponsors/names` | Lightweight seznam pro dropdowny | ADMIN, MANAGER, VOLUNTEER | 60 / min per user |

---

## Platby

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| GET | `/payments` | Seznam plateb + stravenek (query: `search`, `type`, `currency`) | ADMIN, MANAGER, VOLUNTEER |
| POST | `/payments` | Nová platba / nákup stravenek | ADMIN, MANAGER, VOLUNTEER |
| PUT | `/payments` | Úprava platby | ADMIN, MANAGER, VOLUNTEER |
| DELETE | `/payments` | Smazání platby + přepočet předpisů | ADMIN |

---

## Import bankovních výpisů

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| GET | `/payment-imports` | Seznam importů | ADMIN, MANAGER |
| POST | `/payment-imports` | Upload CSV + automatické párování | ADMIN, MANAGER |
| GET | `/payment-imports/[id]` | Detail importu se statistikami | ADMIN, MANAGER |
| DELETE | `/payment-imports/[id]` | Zrušení importu (jen pokud žádný řádek neschválen) | ADMIN |
| POST | `/payment-imports/[id]/approve` | Hromadné schválení řádků → vytvoří platby | ADMIN, MANAGER |
| POST | `/payment-imports/[id]/reject` | Hromadné zamítnutí řádků | ADMIN, MANAGER |
| PUT | `/payment-imports/[id]/rows/[rowId]` | Úprava řádku (sponzor, student, typ) | ADMIN, MANAGER |
| POST | `/payment-imports/[id]/rows/[rowId]/split` | Rozdělení platby na 2–5 částí | ADMIN, MANAGER |

---

## Předpisy školného

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| GET | `/tuition-charges` | Seznam předpisů s výpočtem zaplacené částky | ADMIN, MANAGER |
| POST | `/tuition-charges` | Generování předpisů pro období | ADMIN, MANAGER |
| PUT | `/tuition-charges` | Úprava stavu/poznámky předpisu | ADMIN, MANAGER |
| DELETE | `/tuition-charges` | Smazání předpisů | ADMIN |

---

## Sazby

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| GET | `/tuition-rates` | Čtení sazeb školného (veřejné) | * |
| GET | `/voucher-rates` | Čtení sazeb stravenek (veřejné) | * |

---

## Administrace — číselníky

Všechny CRUD endpointy vyžadují roli **ADMIN**.

| Endpoint | Popis |
|----------|-------|
| `/admin/classrooms` | Třídy (PP1–Grade 12) |
| `/admin/payment-types` | Typy plateb |
| `/admin/need-types` | Typy potřeb |
| `/admin/wish-types` | Typy přání |
| `/admin/health-types` | Typy zdravotních prohlídek |
| `/admin/equipment-types` | Typy vybavení |
| `/admin/tuition-rates` | Sazby školného |
| `/admin/voucher-rates` | Sazby stravenek |

Každý podporuje: **GET** (seznam), **POST** (nový), **PUT** (úprava), **DELETE** (smazání).

---

## Administrace — zálohy

| Metoda | Endpoint | Popis | Rate limit | Role |
|--------|----------|-------|------------|------|
| GET | `/admin/backup/database` | Stažení SQLite zálohy | 5/hod | ADMIN |
| GET | `/admin/backup/csv` | Export dat jako CSV | 10/hod | ADMIN |
| GET | `/admin/backup/json` | Export celé DB jako JSON | 5/hod | ADMIN |
| POST | `/admin/backup/restore` | Upload SQLite zálohy (s validací) | 3/hod | ADMIN |
| POST | `/admin/translate` | Auto-překlad textu (MyMemory API, cs→en/sw) | – | ADMIN |

---

## Audit log

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| GET | `/admin/audit-log` | Posledních 100 záznamů audit trailu (seřazeno dle `createdAt` desc) | ADMIN |

**Záznamy** obsahují: `userId`, `userEmail`, `action` (CREATE/UPDATE/DELETE/LOGIN/EXPORT/RESTORE/APPROVE/REJECT/SPLIT), `resource`, `resourceId`, `detail`, `ip`, `createdAt`.

**Zapisovatel:** helper `logAudit()` z `src/lib/auditLog.ts` — volán po kritických akcích (login, mazání, import approve/reject/split, backup, restore, ...).

---

## Reporty a statistiky

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| GET | `/dashboard` | Přehled: počty, nedávné platby, nesplněné potřeby | * |
| GET | `/statistics` | Detailní statistiky: stravenky, platby, trendy | ADMIN, MANAGER |
| GET | `/reports/visit-cards` | Návštěvní karty (studenti s nesplněnými potřebami po třídách) | ADMIN, MANAGER, VOLUNTEER |

---

## Společné vzory

**Autorizace:** Každý endpoint volá `getCurrentUser()` a kontroluje roli.

**CSRF ochrana:** Middleware (`src/middleware.ts`) ověřuje, že POST/PUT/DELETE/PATCH requesty mají header `x-csrf-token` shodný s cookie `csrf-token`. Klient musí použít `fetchWithCsrf()` z `src/lib/fetchWithCsrf.ts`. Výjimka: `/auth/login` (teprve nastavuje cookie).

**Rate limiting:** In-memory per-key limiter (`src/lib/rateLimit.ts`). Klíč je buď `user.id` (pro autentizované), nebo IP (`x-forwarded-for` / `x-real-ip`). Při překročení 429 + `Retry-After` header.

**Chybové odpovědi:**
| Kód | Význam |
|-----|--------|
| 400 | Neplatná data (Zod validace nebo manuální check) |
| 401 | Nepřihlášen |
| 403 | CSRF token mismatch nebo nedostatečná role |
| 404 | Záznam nenalezen |
| 429 | Rate limit překročen |
| 500 | Interní chyba serveru |

**Soft delete:** Studenti a sponzoři se nemaží, pouze `isActive = false`.

**Transakce:** Komplexní operace (schvalování plateb, split, generování předpisů) používají `prisma.$transaction`.

**Audit trail:** Kritické akce (login, mazání, import schvalování, zálohy) se logují do modelu `AuditLog` přes helper `logAudit()` z `src/lib/auditLog.ts`.
