# Rael School — Informační systém

Webový informační systém pro správu školy Rael v Keni. Evidence studentů, sponzorů, plateb, stravenek, školného, zdravotních prohlídek a vybavení.

## Rychlé spuštění

```bash
npm install
echo 'DATABASE_URL="file:./dev.db"' > .env
npx prisma db push && npm run db:seed
npm run dev
```

Otevřete **http://localhost:3000**

### Testy

```bash
npm test          # unit testy (Vitest) — 97 testů
npm run test:watch # watch mode
npm run test:e2e  # E2E testy (Playwright) — 5 spec souborů
```

Unit testy v `src/__tests__/`: auth, auth-endpoint, format, rateLimit, csvParser, paymentMatcher, paymentImport.
E2E testy v `tests/`: login, dashboard, students, payments, admin.

## Přihlašovací údaje

| Role | Email | Heslo |
|------|-------|-------|
| Admin | admin@rael.school | admin123 |
| Manager | manager@rael.school | manager123 |
| Sponzor | `<jmeno.prijmeni>@sponsor.rael.school` (ze seedu) | sponsor123 |
| Dobrovolník | volunteer@rael.school | volunteer123 |

## Technologie

- **Framework:** Next.js 14 (App Router), TypeScript
- **Databáze:** SQLite + Prisma ORM
- **CSS:** Tailwind CSS (včetně dark mode)
- **Autentizace:** JWT (httpOnly cookies) + bcrypt
- **Ikony:** lucide-react
- **Testy:** Vitest (unit) + Playwright (E2E)
- **Lokalizace:** Vlastní i18n (čeština, angličtina, svahilština)

## Funkce

### Dashboard (Přehled)
- Souhrnné statistiky (studenti, sponzoři, platby, potřeby)
- 6 záložek: Studenti, Sponzoři, Platby, Potřeby, Třídy, Školné
- Tříditelné tabulky s kliknutím na záhlaví
- Třídy zobrazeny jako karty/bubliny v gridu s přirozeným řazením (PP1 → Grade 12)
- Cross-tab navigace — klik na třídu v záložce Studenti/Potřeby přepne na detail třídy

### Studenti
- Seznam studentů s vyhledáváním a tříditelným tabulkovým přehledem
- CSV export
- Detail studenta s 10 záložkami:
  1. **Osobní údaje** — jméno, DOB, třída, pohlaví, rodinné informace
  2. **Sponzoři** — přiřazení sponzoři
  3. **Vybavení** — uniformy, boty, pomůcky
  4. **Potřeby** — evidence nesplněných potřeb
  5. **Přání** — přání studentů
  6. **Stravenky** — nákupy stravenek s auto-přepočtem podle sazby
  7. **Platby od sponzorů** — přehled sponzorských plateb
  8. **Školné** — předpisy školného pro studenta
  9. **Zdraví** — záznamy o zdravotních prohlídkách
  10. **Fotografie** — fotogalerie s kategoriemi
- Přidání nového studenta, režim úprav, nahrávání profilové fotky

### Sponzoři
- Seznam sponzorů s vyhledáváním a CSV exportem
- Detail sponzora s přiřazenými studenty
- Klikatelná jména sponzorů v seznamu studentů

### Platby
- Dvě záložky: Sponzorské platby / Stravenky
- Vyhledávání, filtr sponzora, filtr typu platby (AND logika)
- Auto-přepočet počtu stravenek podle sazby z VoucherRate
- CSV export

### Import bankovních výpisů
- Nahrání CSV bankovního výpisu
- Rozdělení platby na části (split) s přiřazením studentů
- Auto-approve při kompletních údajích
- Ruční schvalování neúplných řádků

### Předpisy školného (Tuition)
- Generování předpisů s výběrem studentů a automatickou sazbou
- Souhrnné karty: předepsáno / zaplaceno / zbývá
- Stavy: UNPAID / PARTIAL / PAID
- CSV export

### Návštěvní karty (Visit Cards)
- Dvoustránkový A4 formulář pro každého studenta
- Tisk přes iframe (izolovaný HTML snapshot)

### Administrace
- Správa číselníků: třídy, typy plateb, potřeb, přání, vybavení, zdravotních prohlídek
- Auto-překlad názvů do EN/SW (MyMemory API)
- Inline editace existujících položek
- Sazby stravenek (VoucherRate) — cena 1 stravenky per měna
- Sazby školného (TuitionRate) — roční poplatek podle třídy

### Dark mode
- Přepínání v sidebaru (Moon/Sun ikona)
- Uloženo v localStorage, systémová preference jako fallback

### Další funkce
- 3 jazyky: čeština, angličtina, svahilština
- 4 uživatelské role (Admin, Manager, Sponzor, Dobrovolník)
- Měny: CZK, EUR, USD, KES
- Formátování čísel s oddělovačem tisíců (mezera): `1 500 KES`
- Sticky hlavičky a sticky thead v tabulkách
- Cross-page navigace s řetězovým zpětným odkazem
- Bezpečnostní hlavičky (CSP, HSTS) + rate limiting + CSRF ochrana + audit trail

## Uživatelské role

| Role | Práva |
|------|-------|
| ADMIN | Plný přístup, správa uživatelů, mazání |
| MANAGER | Editace studentů, přidávání dat, přehledy |
| SPONSOR | Pouze své přiřazené studenty (read-only) |
| VOLUNTEER | Editace studentů, přidávání dat |

## Struktura projektu

```
src/
├── app/
│   ├── login/              # Přihlášení
│   ├── dashboard/          # Dashboard (6 záložek)
│   ├── students/           # Seznam + detail (10 záložek) + nový student
│   ├── sponsors/           # Seznam sponzorů
│   ├── classes/            # Přehled tříd
│   ├── payments/           # Platby + import bankovních výpisů
│   ├── tuition/            # Předpisy školného
│   ├── reports/            # Reporty + návštěvní karty
│   ├── admin/              # Administrace číselníků a sazeb
│   └── api/                # REST API endpointy
├── __tests__/              # Vitest testy (97 testů)
│   ├── auth.test.ts        # Auth funkce (hash, token, verify)
│   ├── auth-endpoint.test.ts # Login endpoint
│   ├── csvParser.test.ts   # CSV parser
│   ├── format.test.ts      # Formátovací funkce
│   ├── paymentImport.test.ts # Import plateb — approve, split, reject endpointy (28 testů)
│   ├── paymentMatcher.test.ts # Párování plateb
│   └── rateLimit.test.ts   # Rate limiter
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx     # Navigační sidebar + dark mode toggle
│   ├── admin/              # Komponenty administrace (CodelistSection, VoucherRate, TuitionRate, Backup)
│   ├── student-detail/     # Záložky detailu studenta (10 tab komponent + FormFields)
│   ├── SortHeader.tsx      # Tříditelná hlavička tabulky
│   ├── Toast.tsx           # Toast notifikace
│   └── Pagination.tsx
├── hooks/                  # Sdílené React hooky
│   ├── useFetchList.ts     # Generický fetch hook
│   ├── useFocusTrap.ts     # Focus trap pro dialogy
│   ├── useLocale.ts        # Locale stav + translator
│   ├── useSorting.ts       # Třídění tabulek
│   ├── useStickyTop.ts     # Dynamická výška sticky hlavičky
│   └── useToast.ts         # Toast notifikace
├── lib/                    # Auth, DB, i18n, formátování, CSV, parser, tuition, imageUtils, paymentMatcher, paymentTypes, rateLimit, constants, codelistRoute, validations, csrf, fetchWithCsrf, auditLog
└── messages/               # Překlady (cs.json, en.json, sw.json)
prisma/
├── schema.prisma           # Datový model
├── seed.ts                 # Seed script (148 studentů, 137 sponzorů)
├── dev.db                  # SQLite databáze
├── dev.db.primary          # Plná záloha (včetně runtime dat)
└── dev.db.backup           # Demo záloha (30 studentů)
data/
├── students-real.json      # 148 studentů — strukturovaná data
├── config-real.json        # Číselníky (třídy, typy, sazby)
├── test-bank-import.csv    # Testovací bankovní výpis
└── fio-vypisek-vzor.pdf    # Vzorový PDF výpis z Fio
tests/                        # E2E testy (Playwright)
├── helpers.ts              # Login helper
├── 01-login.spec.ts        # Přihlášení
├── 02-dashboard.spec.ts    # Dashboard
├── 03-students.spec.ts     # Studenti
├── 04-payments.spec.ts     # Platby
└── 05-admin.spec.ts        # Administrace
docs/
├── INDEX.md                # Navigace mezi dokumenty
├── UI_GUIDE.md             # UI/frontend konvence
├── API-REFERENCE.md        # REST API reference (45+ endpointů)
├── PAYMENT-MATCHING.md     # Algoritmus párování plateb
└── SPEC-payment-import.md  # Specifikace importu plateb
```

## Zálohy a obnova dat

**Obnovit plnou zálohu** (včetně předpisů, plateb, stravenek):
```bash
cp prisma/dev.db.primary prisma/dev.db
```

**Znovu naseedit od nuly** (pouze základní data):
```bash
npx prisma db push && npm run db:seed
```

**Obnovit demo data** (30 testovacích studentů):
```bash
cp prisma/dev.db.backup prisma/dev.db
```

## Statistiky dat

- **148 studentů** (8 bez sponzora)
- **137 unikátních sponzorů**, 160 sponzorských vazeb
- **224 položek vybavení**, 31 zdravotních prohlídek
- **14 tříd** (PP1 – Grade 12)
- **Školné:** 3 700 CZK (do Grade 6), 4 700 CZK (od Grade 7)
