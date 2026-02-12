# Rael School — Informační systém

## Popis projektu

Webový informační systém pro správu školy Rael v Keni. Sleduje studenty, sponzory, stravenky, zdravotní prohlídky a platby.

## Technologie

- **Framework:** Next.js 14 (React 18)
- **Databáze:** SQLite + Prisma ORM
- **Styling:** Tailwind CSS
- **Jazyk:** TypeScript
- **Autentizace:** JWT + bcryptjs
- **Jazyky rozhraní:** čeština, angličtina, svahilština

## Implementované funkce

### Fáze 1 — Jádro systému
- Databáze se všemi tabulkami (studenti, sponzoři, stravenky, vybavení, potřeby, zdravotní prohlídky, platby)
- Přihlašovací systém se 4 rolemi (Admin, Manager, Sponzor, Dobrovolník)
- Dashboard s přehledem statistik
- Seznam studentů s vyhledáváním
- Detail studenta se záložkami (osobní údaje, fotky, stravenky, sponzoři, zdravotní prohlídky, platby)
- Přidání nového studenta (s výběrem třídy z číselníku)
- Režim úprav s potvrzovacím dialogem
- Trojjazyčnost (čeština, angličtina, svahilština)
- Formátování čísel na tisíce

### Fáze 2 — Rozšíření
- Stránka Sponzoři — seznam s vyhledáváním, přidání, editace, aktivace/deaktivace
- Stránka Platby — záložky sponzorské platby a stravenky, CRUD operace
- Stránka Třídy — přehled tříd se studenty, řazení
- Stránka Statistiky — stravenky na studenta, platby od sponzorů, filtrování
- Stránka Administrace — číselníky tříd, typů prohlídek a typů plateb (CRUD, řazení)
- Stránkování (pagination) na stránkách Studenti (12/str), Sponzoři (10/str), Platby (15/str)
- Znovupoužitelná komponenta `Pagination` s překlady ve 3 jazycích

## Struktura projektu

```
src/
  app/
    api/              # API routes (students, sponsors, payments, dashboard, statistics, admin)
    students/         # Seznam studentů, detail, nový student
    sponsors/         # Seznam sponzorů
    payments/         # Platby (sponzorské + stravenky)
    dashboard/        # Přehledový dashboard
    classes/          # Přehled tříd
    reports/          # Statistiky
    admin/            # Administrace číselníků
    login/            # Přihlášení
  components/
    layout/           # Sidebar, Header
    Pagination.tsx    # Znovupoužitelná paginace
  lib/                # DB, auth, formátování, i18n
  messages/           # Překlady (cs.json, en.json, sw.json)
prisma/
  schema.prisma       # Datový model (13 tabulek)
  seed.ts             # Testovací data
```

## Instalace a spuštění

```bash
npm install
npm run setup        # Vytvoří databázi a naplní testovacími daty
npm run dev          # Spustí vývojový server na http://localhost:3000
```

## Testovací přihlášení

| Role         | Email                  | Heslo       |
|--------------|------------------------|-------------|
| Admin        | admin@rael.school      | admin123    |
| Manager      | manager@rael.school    | manager123  |
| Sponzor      | sponsor@rael.school    | sponsor123  |
| Dobrovolník  | volunteer@rael.school  | volunteer123|

## Jak zastavit a znovu spustit

- Zastavit: **Ctrl + C** v terminálu
- Spustit znovu: `npm run dev`
