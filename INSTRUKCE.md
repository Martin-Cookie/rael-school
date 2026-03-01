# Rael School — Informationssystem

 translation/german
## Projektbeschreibung
Webbasiertes Informationssystem zur Verwaltung der Rael-Schule in Kenia. Erfasst Schüler, Sponsoren, Essensmarken, Gesundheitsuntersuchungen und Zahlungen.

## Technologien
- **Framework:** Next.js 14 (React 18)
- **Datenbank:** SQLite + Prisma ORM
- **Styling:** Tailwind CSS
- **Sprache:** TypeScript
- **Authentifizierung:** JWT + bcryptjs
- **Oberflächensprachen:** Tschechisch, Englisch, Suaheli

## Implementierte Funktionen

### Phase 1 — Kernsystem
- Datenbank mit allen Tabellen (Schüler, Sponsoren, Essensmarken, Ausstattung, Bedürfnisse, Gesundheitsuntersuchungen, Zahlungen)
- Anmeldesystem mit 4 Rollen (Admin, Manager, Sponsor, Freiwilliger)
- Dashboard mit Statistikübersicht
- Schülerliste mit Suchfunktion
- Schülerdetail mit Registerkarten (persönliche Daten, Fotos, Essensmarken, Sponsoren, Gesundheitsuntersuchungen, Zahlungen)
- Neuen Schüler hinzufügen (mit Klassenauswahl aus dem Verzeichnis)
- Bearbeitungsmodus mit Bestätigungsdialog
- Dreisprachigkeit (Tschechisch, Englisch, Suaheli)
- Zahlenformatierung in Tausender

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
 main

### Phase 2 — Erweiterungen
- Sponsorenseite — Liste mit Suche, Hinzufügen, Bearbeiten, Aktivieren/Deaktivieren
- Zahlungsseite — Registerkarten für Sponsorenzahlungen und Essensmarken, CRUD-Operationen
- Klassenseite — Klassenübersicht mit Schülern, Sortierung
- Statistikseite — Essensmarken pro Schüler, Zahlungen von Sponsoren, Filterung
- Administrationsseite — Verzeichnisse für Klassen, Untersuchungstypen und Zahlungstypen (CRUD, Sortierung)
- Seitenumbruch (Pagination) auf den Seiten Schüler (12/Seite), Sponsoren (10/Seite), Zahlungen (15/Seite)
- Wiederverwendbare `Pagination`-Komponente mit Übersetzungen in 3 Sprachen
- Foto-Upload — clientseitige Bildkomprimierung (Canvas API, max. 1600px Galerie / 400px Profil), Typ- und Größenvalidierung (max. 10 MB), Ladeindikator beim Hochladen

## Projektstruktur
```
src/
 translation/german
  app/
    api/              # API-Routen (Schüler, Sponsoren, Zahlungen, Dashboard, Statistiken, Admin)
    students/         # Schülerliste, Detail, neuer Schüler
    sponsors/         # Sponsorenliste
    payments/         # Zahlungen (Sponsoren + Essensmarken)
    dashboard/        # Übersichts-Dashboard
    classes/          # Klassenübersicht
    reports/          # Statistiken
    admin/            # Verwaltung der Verzeichnisse
    login/            # Anmeldung
  components/
    layout/           # Sidebar, Header
    Pagination.tsx    # Wiederverwendbare Pagination
  lib/                # DB, Auth, Formatierung, i18n, Bildkomprimierung
  messages/           # Übersetzungen (cs.json, en.json, sw.json)
prisma/
  schema.prisma       # Datenmodell (13 Tabellen)
  seed.ts             # Testdaten

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
> main
```

## Installation und Start
```bash
npm install
 translation/german
npm run setup        # Erstellt die Datenbank und befüllt sie mit Testdaten
npm run dev          # Startet den Entwicklungsserver unter http://localhost:3000
```

## Test-Anmeldedaten
| Rolle        | E-Mail                 | Passwort     |
|--------------|------------------------|--------------|
| Admin        | admin@rael.school      | admin123     |
| Manager      | manager@rael.school    | manager123   |
| Sponsor      | sponsor@rael.school    | sponsor123   |
| Freiwilliger | volunteer@rael.school  | volunteer123 |

## Stoppen und neu starten
- Stoppen: **Ctrl + C** im Terminal
- Neu starten: `npm run dev`

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
 main
