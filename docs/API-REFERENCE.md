# API Reference

> **Base URL:** `/api`
> **Auth:** Všechny endpointy vyžadují JWT token v httpOnly cookie `auth-token` (kromě `/api/auth/login`).

---

## Autentizace

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| POST | `/auth/login` | Přihlášení (email + heslo), vrací cookie | public |
| POST | `/auth/logout` | Odhlášení, smaže cookie | * |
| GET | `/auth/me` | Profil přihlášeného uživatele | * |

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

| Metoda | Endpoint | Popis | Role |
|--------|----------|-------|------|
| GET | `/sponsors` | Seznam sponzorů (query: `search`, `active`) | ADMIN, MANAGER, VOLUNTEER |
| POST | `/sponsors` | Nový sponzor | ADMIN, MANAGER, VOLUNTEER |
| GET | `/sponsors/[id]` | Detail sponzora s vazbami | * |
| PUT | `/sponsors/[id]` | Úprava sponzora | ADMIN, MANAGER, VOLUNTEER |
| PATCH | `/sponsors/[id]` | Toggle aktivní/neaktivní (kaskáda na sponzorství) | ADMIN, MANAGER |
| GET | `/sponsors/search` | Autocomplete hledání (top 10) | * |
| GET | `/sponsors/names` | Lightweight seznam pro dropdowny | * |

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
| POST | `/admin/translate` | Auto-překlad textu (MyMemory API) | – | ADMIN |

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

**Chybové odpovědi:**
| Kód | Význam |
|-----|--------|
| 401 | Nepřihlášen |
| 403 | Nedostatečná oprávnění |
| 404 | Záznam nenalezen |
| 400 | Neplatná data (Zod validace) |
| 500 | Interní chyba serveru |

**Soft delete:** Studenti a sponzoři se nemaží, pouze `isActive = false`.

**Transakce:** Komplexní operace (schvalování plateb, split, generování předpisů) používají `prisma.$transaction`.
