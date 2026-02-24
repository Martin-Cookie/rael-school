# Rael School — Informační systém

## Popis projektu

Webový informační systém pro správu školy Rael v Keni. Evidence studentů, sponzorů, plateb, stravenek, školného, zdravotních prohlídek, vybavení, potřeb a přání.

## Technologie

- **Framework:** Next.js 14 (App Router), TypeScript
- **Databáze:** SQLite + Prisma ORM
- **Styling:** Tailwind CSS (včetně dark mode)
- **Autentizace:** JWT (httpOnly cookies) + bcrypt
- **Ikony:** lucide-react
- **Lokalizace:** Vlastní i18n (čeština, angličtina, svahilština)

## Implementované funkce

### Dashboard (Přehled)
- Souhrnné statistiky (studenti, sponzoři, platby, potřeby)
- 5 záložek: Studenti, Sponzoři, Platby, Potřeby, Třídy
- Tříditelné tabulky kliknutím na záhlaví (SortHeader pattern)
- Třídy jako karty/bubliny v gridu s přirozeným řazením (PP1 → Grade 12)
- Cross-tab navigace — klik na třídu přepne na detail, zpět vrací na zdrojovou záložku

### Studenti
- Tříditelný seznam s vyhledáváním a CSV exportem
- Detail studenta s 9 záložkami:
  1. Osobní údaje — jméno, DOB, třída, pohlaví, osiřelost, rodinné informace
  2. Sponzoři — přiřazení sponzoři
  3. Vybavení — uniformy, boty, pomůcky (s cenou a stavem)
  4. Potřeby — evidence nesplněných potřeb
  5. Přání — přání studentů
  6. Stravenky — nákupy stravenek s auto-přepočtem podle VoucherRate
  7. Platby od sponzorů — přehled sponzorských plateb
  8. Zdraví — záznamy o zdravotních prohlídkách
  9. Fotografie — fotogalerie s kategoriemi
- Přidání nového studenta, režim úprav, nahrávání profilové fotky
- Klientská komprese obrázků (Canvas API)

### Sponzoři
- Tříditelný seznam s vyhledáváním a CSV exportem
- Detail sponzora s přiřazenými studenty
- Klikatelná jména sponzorů v seznamu studentů → navigace na stránku Sponzoři

### Platby
- Dvě záložky: Sponzorské platby / Stravenky
- Vyhledávání, filtr sponzora, filtr typu platby (AND logika)
- Auto-přepočet počtu stravenek podle sazby z VoucherRate
- CSV export

### Import bankovních výpisů
- Nahrání CSV bankovního výpisu
- Rozdělení platby na části (split) s přiřazením studentů a typu
- Auto-approve při kompletních údajích (studentId + paymentTypeId)
- Ruční schvalování/odmítnutí neúplných řádků

### Předpisy školného (Tuition Charges)
- Generování předpisů s výběrem studentů (checkboxy, filtr tříd, hledání)
- Sazba automaticky podle třídy studenta a TuitionRate
- Souhrnné karty: předepsáno / zaplaceno / zbývá
- Stavy: UNPAID / PARTIAL / PAID (barevné badge)
- CSV export

### Návštěvní karty (Visit Cards)
- Dvoustránkový A4 formulář pro každého studenta
- Stránka 1: header, sponzoři, základní info, rodina, vybavení
- Stránka 2: potřeby, přání, obecné poznámky (flex-fill)
- Tisk přes iframe (izolovaný HTML snapshot)

### Administrace
- Správa číselníků: třídy, typy plateb, potřeb, přání, vybavení, zdravotních prohlídek
- Auto-překlad názvů do EN/SW (MyMemory API, toggle Globe tlačítko)
- Inline editace existujících položek (click-to-edit)
- Sazby stravenek (VoucherRate) — cena 1 stravenky per měna (CZK, EUR, USD, KES)
- Sazby školného (TuitionRate) — roční poplatek podle rozsahu tříd
- Záloha a obnova databáze

### Dark mode
- Přepínání v sidebaru (Moon/Sun ikona)
- Tailwind `darkMode: 'class'` + CSS proměnné
- Uloženo v localStorage (`rael-theme`), systémová preference jako fallback

### Cross-page navigace
- Klikatelní sponzoři v seznamu studentů → stránka Sponzoři s vyhledáváním
- Zachování aktivní záložky v dashboardu přes URL parametry (`tab`, `paymentSubTab`)
- Řetězová zpětná navigace v detailu studenta
- Filtr sponzorů ve formuláři platby podle vybraného studenta

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
│   ├── dashboard/          # Dashboard (5 záložek)
│   ├── students/           # Seznam + detail (9 záložek) + nový student
│   ├── sponsors/           # Seznam sponzorů
│   ├── classes/            # Přehled tříd
│   ├── payments/           # Platby + import bankovních výpisů
│   ├── tuition/            # Předpisy školného
│   ├── reports/            # Reporty + návštěvní karty
│   ├── admin/              # Administrace číselníků a sazeb
│   └── api/                # REST API endpointy
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx     # Navigační sidebar + dark mode toggle
│   └── Pagination.tsx
├── lib/                    # Auth, DB, i18n, formátování, CSV, parser
└── messages/               # Překlady (cs.json, en.json, sw.json)
prisma/
├── schema.prisma           # Datový model
├── seed.ts                 # Seed script (148 studentů, 137 sponzorů)
├── dev.db                  # SQLite databáze
├── dev.db.primary          # Plná záloha (včetně runtime dat)
└── dev.db.backup           # Demo záloha (30 studentů)
data/
├── students-real.json      # 148 studentů — strukturovaná data
└── config-real.json        # Číselníky (třídy, typy, sazby)
```

## Instalace a spuštění

```bash
npm install
echo 'DATABASE_URL="file:./dev.db"' > .env
npx prisma db push && npm run db:seed
npm run dev
```

Otevřete **http://localhost:3000**

## Přihlašovací údaje

| Role | Email | Heslo |
|------|-------|-------|
| Admin | admin@rael.school | admin123 |
| Manager | manager@rael.school | manager123 |
| Sponzor | `<jmeno.prijmeni>@sponsor.rael.school` | sponsor123 |
| Dobrovolník | volunteer@rael.school | volunteer123 |

## Jak zastavit a znovu spustit

- Zastavit: **Ctrl + C** v terminálu
- Spustit znovu: `npm run dev`

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
