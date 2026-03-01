# Rael School — Audit Report (2026-03-01)

## Souhrn

| Severity | Počet |
|----------|-------|
| CRITICAL | 9 |
| HIGH | 14 |
| MEDIUM | 16 |
| LOW | 6 |
| **Celkem** | **45** |

---

## Souhrnná tabulka

| # | Oblast | Soubor | Severity | Problém | Doporučení |
|---|--------|--------|----------|---------|------------|
| 1 | Bezpečnost | `api/students/[id]/route.ts` | CRITICAL | SPONSOR uživatel může přistoupit k libovolnému studentovi — chybí authorizace na GET | Přidat kontrolu sponsorship vazby pro SPONSOR roli |
| 2 | Výkon | `api/tuition-charges/route.ts:48-89` | CRITICAL | N+1 dotaz — pro každý předpis školného se volá `prisma.sponsorPayment.findMany()` v cyklu | Batch-load všechny platby jedním dotazem, agregovat v JS |
| 3 | Výkon | `lib/tuition.ts:21-54` | CRITICAL | N+1 dotaz — `recalcTuitionStatus` volá query per charge v cyklu | Batch-load platby jedním dotazem |
| 4 | Testy | projekt celý | CRITICAL | Žádné testy — 0 test souborů, žádný test framework, žádný test script | Přidat Vitest, pokrýt API autorizaci a business logiku |
| 5 | Git | `prisma/dev.db.primary` (504 KB) | CRITICAL | Binární SQLite soubory v git repozitáři — způsobují bloat a merge konflikty | Přidat `prisma/dev.db*` do .gitignore, odstranit z history |
| 6 | Git | `prisma/dev.db.backup` (160 KB) | CRITICAL | Stejný problém jako výše | Viz #5 |
| 7 | Kód | `admin/page.tsx` (1219 řádků) | CRITICAL | Příliš dlouhý soubor — těžko udržovatelný | Rozdělit na VoucherRateSection, TuitionRateSection, AdminLayout |
| 8 | Kód | `students/[id]/page.tsx` (1178 řádků) | CRITICAL | Příliš dlouhý soubor — 10 záložek v jednom souboru | Extrahovat záložky do samostatných komponent |
| 9 | Kód | 3 soubory | CRITICAL | `CURRENCIES` konstanta definována 3× (payments, students/[id], admin) | Extrahovat do `src/lib/constants.ts` |
| 10 | Bezpečnost | `lib/auth.ts:6` | HIGH | JWT_SECRET má fallback na hardcoded string `'rael-school-secret-key'` | Throwovat error pokud env var není nastavená |
| 11 | Bezpečnost | `api/auth/login/route.ts` | HIGH | Žádný rate limiting na login endpoint | Implementovat rate limiting per IP/email |
| 12 | Bezpečnost | `api/students/[id]/photos/route.ts` | HIGH | Chybí validace MIME typu u upload fotek — pouze kontrola přípony | Přidat whitelist MIME typů + magic bytes kontrolu |
| 13 | Bezpečnost | `api/students/[id]/profile-photo/route.ts` | HIGH | Stejný problém jako #12 | Viz #12 |
| 14 | Výkon | `api/dashboard/route.ts` | HIGH | Načítá VŠECHNA data (platby, stravenky, předpisy) bez limitu | Přidat `.take()` limity, nebo rozdělit na endpointy per záložka |
| 15 | Výkon | `api/statistics/route.ts` | HIGH | Načítá všechny transakce bez filtrů/limitů | Přidat date range filtr nebo limity |
| 16 | Výkon | `lib/paymentMatcher.ts:87-104` | HIGH | 2 dotazy per řádek importu (duplicate detection) — 200+ dotazů u 100 řádků | Pre-load platby/stravenky jedním dotazem, matchovat v paměti |
| 17 | Výkon | `api/payment-imports/[id]/approve/route.ts:51,141` | HIGH | `paymentType.findMany()` voláno 2× ve stejném requestu | Fetch jednou, reuse |
| 18 | Výkon | `api/payment-imports/[id]/rows/[rowId]/split/route.ts:59,206` | HIGH | Stejný problém jako #17 | Fetch jednou, reuse |
| 19 | Kód | 6 souborů | HIGH | `SH()` wrapper funkce redefinována 6× — sdílený `<SortHeader>` existuje ale nepoužívá se přímo | Odstranit lokální SH(), importovat `<SortHeader>` přímo |
| 20 | Kód | `package.json` | HIGH | `date-fns` dependency je nepoužívaná — žádný import v src/ | Odstranit z package.json |
| 21 | UI | `students/page.tsx`, `sponsors/page.tsx` | HIGH | Sticky hlavička chybí `dark:bg-gray-900`, sticky thead chybí `dark:bg-gray-800` | Přidat dark mode třídy |
| 22 | UI | 8+ souborů | HIGH | 70+ instancí `bg-white` bez `dark:bg-gray-800` | Přidat dark mode varianty |
| 23 | UI | `students/new/page.tsx` a další | HIGH | Formulářové inputy bez dark mode (`dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600`) | Přidat dark mode na všechny inputy |
| 24 | Bezpečnost | API routes | MEDIUM | Žádná CSRF ochrana — Next.js 14 ji nemá automaticky | Implementovat CSRF token nebo SameSite=strict |
| 25 | Bezpečnost | `api/sponsors/route.ts:114` | MEDIUM | Noví sponzoři mají hardcoded heslo `'sponsor123'` | Generovat náhodné heslo, vyžadovat změnu při prvním přihlášení |
| 26 | Bezpečnost | `api/students/[id]/photos/route.ts` | MEDIUM | Chybí validace velikosti souboru u upload fotek | Přidat max file size limit (např. 10 MB) |
| 27 | Bezpečnost | `api/payment-imports/route.ts` | MEDIUM | CSV import kontroluje příponu ale ne obsah | Validovat strukturu CSV a hlavičky |
| 28 | Výkon | `prisma/schema.prisma` | MEDIUM | Chybí DB indexy — SponsorPayment.studentId, VoucherPurchase.studentId, PaymentImportRow.importId, Student.isActive | Přidat `@@index` do schématu |
| 29 | Výkon | `students/[id]/page.tsx:88` | MEDIUM | 10 paralelních fetch volání při načtení detailu studenta | Cachovat číselníky, lazy-load data per záložka |
| 30 | Výkon | `students/[id]/page.tsx:41` | MEDIUM | Načítá všech 137 sponzorů jen pro dropdown | Vytvořit lightweight endpoint `/api/sponsors/names` |
| 31 | Výkon | `payments/page.tsx:80-86` | MEDIUM | Platby stahují celý `/api/dashboard` místo vlastního endpointu | Vytvořit dedikovaný `/api/payments` endpoint |
| 32 | Výkon | všechny hlavní stránky | MEDIUM | Všechny stránky jsou `'use client'` — žádné Server Components | Zvážit Server Components pro shell + Suspense |
| 33 | Kód | `admin/page.tsx:19` | MEDIUM | `formatNumber()` lokální kopie — existuje v `lib/format.ts` | Importovat z lib |
| 34 | Kód | `sponsors/page.tsx:149` | MEDIUM | `formatCurrency()` lokální implementace — odlišná od lib verze | Použít lib verzi |
| 35 | Kód | 7 souborů | MEDIUM | `const msgs = { cs, en, sw }` pattern duplikován — `useLocale()` hook existuje | Použít `useLocale()` hook konzistentně |
| 36 | UI | více stránek | MEDIUM | Nekonzistentní button padding — mix `px-3 py-2`, `px-4 py-2.5`, `px-5 py-2.5` a `rounded-lg` vs `rounded-xl` | Standardizovat na `px-4 py-2.5 rounded-xl` |
| 37 | UI | dashboard, sponsors, admin | MEDIUM | Kontrastní poměr pod WCAG AA — `text-gray-500` na `bg-gray-50` (3.2:1) | Zvýšit kontrast na 4.5:1 |
| 38 | UI | více stránek | MEDIUM | Icon-only tlačítka bez `aria-label` (edit, delete, translate) | Přidat `aria-label` pro screen readery |
| 39 | UI | `students/new/page.tsx` a další | MEDIUM | Formulářové labely nejsou propojené s inputy (`htmlFor` chybí) | Přidat `id` na inputy a `htmlFor` na labely |
| 40 | Git | `.DS_Store`, `docs/.DS_Store` | MEDIUM | macOS metadata soubory commitnuté v repo | `git rm --cached`, .gitignore je správně |
| 41 | Error | projekt celý | MEDIUM | Chybí custom error stránky (`error.tsx`, `not-found.tsx`) | Vytvořit s konzistentním designem |
| 42 | Error | admin CRUD routes | MEDIUM | UPDATE/DELETE operace nemají 404 kontrolu — Prisma P2025 se chytí jako 500 | Přidat existence check před operací |
| 43 | UI | `students/[id]/page.tsx` | LOW | Profilová fotka má prázdný `alt=""` atribut | Přidat smysluplný alt text |
| 44 | Bezpečnost | API routes | LOW | Žádná validace délky řetězců (jména, poznámky) | Přidat max length validaci |
| 45 | Výkon | `students/[id]/page.tsx` | LOW | Fotky používají `<img>` místo Next.js `<Image>` — žádná optimalizace | Zvážit Next.js Image komponentu |

---

## Detailní nálezy

### 1. Kódová kvalita

#### 1.1 Duplikáty

**CURRENCIES konstanta (CRITICAL)** — definována 3×:
- `src/app/payments/page.tsx:16`
- `src/app/students/[id]/page.tsx:18`
- `src/app/admin/page.tsx:13`

→ Extrahovat do `src/lib/constants.ts`

**SH() wrapper (HIGH)** — lokální funkce v 6 stránkách, přestože existuje `<SortHeader>`:
- `students/page.tsx:32`, `sponsors/page.tsx:153`, `payments/page.tsx:116`
- `classes/page.tsx:23`, `tuition/page.tsx:66`, `payments/import/[id]/page.tsx:371`

→ Použít importovaný `<SortHeader>` přímo

**const msgs pattern (MEDIUM)** — duplikován v 7 souborech místo použití `useLocale()` hooku:
- `payments/import/page.tsx`, `admin/page.tsx`, `students/new/page.tsx`, `reports/visit-cards/print/page.tsx`, `reports/visit-cards/page.tsx`, `reports/page.tsx`, `components/layout/Sidebar.tsx`

**formatNumber() a formatCurrency() (MEDIUM)** — lokální kopie v `admin/page.tsx` a `sponsors/page.tsx`, přestože existují v `lib/format.ts`

#### 1.2 Struktura

**Příliš dlouhé soubory:**

| Soubor | Řádků | Doporučení |
|--------|-------|------------|
| `admin/page.tsx` | 1219 | Rozdělit na sub-komponenty |
| `students/[id]/page.tsx` | 1178 | Extrahovat záložky |
| `payments/import/[id]/page.tsx` | 837 | Extrahovat split modal |
| `reports/page.tsx` | 720 | Extrahovat sekce reportů |

#### 1.3 Závislosti

- `date-fns` v package.json je nepoužívaná — žádný import v src/

---

### 2. Bezpečnost

#### 2.1 Autorizace

**SPONSOR může přistoupit k libovolnému studentovi (CRITICAL):**
- `GET /api/students/[id]` kontroluje autentizaci ale NE autorizaci
- Seznam studentů (`GET /api/students`) správně filtruje podle sponsorship vazby
- Detail studenta tuto kontrolu nemá — SPONSOR může získat data jakéhokoli studenta

**JWT_SECRET fallback (HIGH):**
```typescript
// src/lib/auth.ts:6
const JWT_SECRET = process.env.JWT_SECRET || 'rael-school-secret-key'
```
→ Pokud env var chybí, použije se známý slabý secret

**Žádný rate limiting na login (HIGH):**
- Neomezený počet pokusů o přihlášení
- Brute force útok je triviální

#### 2.2 Vstupní data

**Upload fotek (HIGH):**
- Kontrola pouze přípony souboru, ne MIME typu ani magic bytes
- Chybí limit velikosti souboru
- Riziko: upload libovolného souboru s příponou `.jpg`

**CSV import (MEDIUM):**
- Kontroluje příponu `.csv` ale ne strukturu/hlavičky obsahu

#### 2.3 Citlivá data

- Hesla hashována bcryptjs (10 rounds) ✓
- `.env` v .gitignore ✓
- Cookie: httpOnly ✓, SameSite=lax ✓, secure v produkci ✓
- Nově vytvoření sponzoři mají hardcoded heslo `sponsor123`

---

### 3. Dokumentace

- CLAUDE.md, UI_GUIDE.md, README.md — **synchronizovány** (předchozí audit)
- Žádné TODO/FIXME/HACK komentáře v kódu (čisté)
- Chybí JSDoc komentáře na API routes a utility funkcích

---

### 4. UI / Konzistence

#### 4.1 Dark mode mezery

**Sticky hlavičky (HIGH):**
- `students/page.tsx` a `sponsors/page.tsx` — chybí `dark:bg-gray-900` na sticky header a `dark:bg-gray-800` na thead
- Ostatní stránky (payments, dashboard, tuition) mají dark mode správně

**Formuláře (HIGH):**
- `students/new/page.tsx` — 9+ inputů bez dark mode tříd
- Sporadicky chybí i na dalších stránkách

**Rozsah problému:**
- ~70 instancí `bg-white` bez `dark:bg-gray-800`
- ~35 instancí `text-gray-900` bez `dark:text-gray-100`
- ~40 instancí `border-gray-200` bez `dark:border-gray-700`

#### 4.2 Konzistence komponent

- Tlačítka: mix `rounded-lg` / `rounded-xl` a různý padding
- Badge/status: většina správně, sporadicky chybí dark mode varianta

#### 4.3 Přístupnost (WCAG AA)

- Formulářové labely nepropojené s inputy (`htmlFor` chybí) — ~40 polí
- Icon-only tlačítka bez `aria-label`
- Kontrastní poměr `text-gray-500` na `bg-gray-50` = 3.2:1 (pod WCAG AA 4.5:1)
- Profilová fotka s prázdným `alt=""`

---

### 5. Výkon

#### 5.1 N+1 dotazy

| Místo | Dotazů | Dopad |
|-------|--------|-------|
| Tuition charges GET | 100+ per page load | Výpočet zaplaceno per předpis |
| recalcTuitionStatus | 10+ per payment edit | Přepočet stavu per charge |
| Payment import matching | 200+ per import | 2 dotazy per řádek (duplicate check) |
| approve/split routes | 2× paymentType | Duplicitní lookup |

#### 5.2 Chybějící indexy

```prisma
// Chybí v schema.prisma:
@@index([studentId])    // SponsorPayment, VoucherPurchase, Equipment, Need, HealthCheck
@@index([importId])     // PaymentImportRow
@@index([paymentDate])  // SponsorPayment
@@index([isActive])     // Student
```

#### 5.3 Nadměrné načítání dat

- Dashboard API načítá vše bez limitu (platby, stravenky, předpisy)
- Payments stránka volá `/api/dashboard` místo vlastního endpointu
- Student detail: 10 paralelních fetch volání, číselníky se nenačítají lazy

---

### 6. Error Handling

- API routes mají try/catch bloky ✓
- Chybí custom error stránky (`error.tsx`, `not-found.tsx`)
- UPDATE/DELETE operace nemají 404 check — Prisma P2025 se chytí jako 500
- Translate endpoint vrací 200 i při chybě (místo 500)

---

### 7. Git Hygiene

- Binární SQLite soubory (`dev.db.primary`, `dev.db.backup`) commitnuté — 664 KB zbytečného bloatu
- `.DS_Store` soubory commitnuté (macOS metadata)
- 6 untracked `.md` souborů v rootu (agent scripty) — rozhodnout: commitnout nebo .gitignore
- Commit messages kvalitní ✓
- `.env` v .gitignore ✓

---

### 8. Testy

**ZERO TEST COVERAGE:**
- 0 test souborů (`*.test.ts`, `*.test.tsx`, `*.spec.ts`)
- Žádný test framework (jest/vitest) nainstalovaný
- Žádný test script v package.json
- Žádné CI/CD pipeline

**Nejvyšší priorita pro testy:**
1. API autorizace (sponsor data access bypass)
2. Tuition výpočty (business logika)
3. Voucher rate konverze
4. Payment split logika
5. Utility funkce (`lib/format.ts`, `lib/auth.ts`)

---

## Doporučený postup oprav

### 1. CRITICAL (opravit ihned)

1. **Bezpečnost:** Přidat authorizaci na `GET /api/students/[id]` pro SPONSOR roli
2. **Výkon:** Opravit N+1 dotazy v tuition-charges a recalcTuitionStatus
3. **Testy:** Nainstalovat Vitest, napsat testy pro API autorizaci
4. **Git:** Přidat `prisma/dev.db*` do .gitignore, odstranit z history
5. **Kód:** Extrahovat CURRENCIES do shared constants

### 2. HIGH (opravit před produkcí)

6. **Bezpečnost:** JWT_SECRET — throwovat error pokud chybí env var
7. **Bezpečnost:** Přidat MIME type validaci na upload fotek
8. **Bezpečnost:** Implementovat rate limiting na login
9. **Výkon:** Přidat DB indexy do schema.prisma
10. **Výkon:** Přidat limity na dashboard/statistics API
11. **UI:** Doplnit dark mode na students/sponsors sticky hlavičky
12. **Kód:** Odstranit lokální SH() funkce, použít `<SortHeader>` přímo

### 3. MEDIUM (naplánovat do dalších iterací)

13. Standardizovat button styly napříč stránkami
14. Doplnit dark mode na formuláře a karty
15. Přidat htmlFor/aria-label pro přístupnost
16. Vytvořit custom error stránky
17. Rozdělit dlouhé soubory (admin, student detail)
18. Přidat 404 kontroly na CRUD operace

### 4. LOW (nice to have)

19. Next.js Image komponenta pro fotky
20. Validace délky vstupních řetězců
21. JSDoc komentáře na API routes
