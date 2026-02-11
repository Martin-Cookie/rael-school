# Rael School — Informační systém

Evidenční systém pro školu Rael v Keni. Sledování studentů, sponzorů, stravenek, zdravotních prohlídek a plateb.

## Rychlé spuštění

```bash
npm install
npm run setup
npm run dev
```

Otevřete **http://localhost:3000**

## Přihlašovací údaje (demo)

| Role | Email | Heslo |
|------|-------|-------|
| Admin | admin@rael.school | admin123 |
| Manager | manager@rael.school | manager123 |
| Sponzor | sponsor@example.com | sponsor123 |
| Dobrovolník | volunteer@example.com | volunteer123 |

## Technologie

- Next.js 14 (React)
- SQLite + Prisma ORM
- Tailwind CSS
- TypeScript

## Funkce

### Dashboard (Přehled)
- Statistiky: počet studentů, sponzorů, plateb, stravenek, potřeb
- Tabulkový přehled studentů, sponzorů, plateb, stravenek, potřeb a tříd
- Řazení sloupců kliknutím na záhlaví

### Studenti
- Seznam studentů (dlaždice s kartami)
- Detail studenta se záložkami:
  - **Osobní údaje** — jméno, datum narození, třída, pohlaví, rodinné informace
  - **Vybavení** — uniformy, boty, pomůcky
  - **Potřeby** — evidence nesplněných potřeb
  - **Stravenky** — nákupy a čerpání stravenek
  - **Fotky** — fotogalerie s kategoriemi
  - **Sponzoři** — přiřazení sponzoři
  - **Zdravotní prohlídky** — záznamy o prohlídkách
  - **Platby sponzorů** — přehled plateb od sponzorů
- Přidání nového studenta
- Režim úprav s potvrzovacím dialogem
- Nahrávání profilové fotky

### Sponzoři
- Seznam sponzorů
- Detail sponzora s přiřazenými studenty
- Vyhledávání sponzorů

### Platby
- Evidence plateb (školné, zdravotní, ostatní)
- Filtrování a přehled

### Reporty
- Přehledy a statistiky

### Administrace
- Správa tříd (ClassRooms)
- Správa typů zdravotních prohlídek
- Správa typů plateb

### Další funkce
- 3 jazyky: čeština, angličtina, svahilština
- 4 uživatelské role s různými oprávněními (Admin, Manager, Sponzor, Dobrovolník)
- Přepínání měn (KES, CZK, USD, EUR)

## Struktura projektu

```
src/
├── app/
│   ├── login/          # Přihlášení
│   ├── dashboard/      # Dashboard (Přehled)
│   ├── students/       # Studenti (seznam + detail + nový)
│   ├── sponsors/       # Sponzoři
│   ├── payments/       # Platby
│   ├── reports/        # Reporty
│   ├── admin/          # Administrace
│   └── api/            # REST API endpointy
├── components/
│   └── layout/
│       └── Sidebar.tsx  # Navigační sidebar
├── lib/                 # Pomocné funkce (auth, formátování, i18n)
└── messages/            # Jazykové soubory (cs, en, sw)
prisma/
├── schema.prisma        # Databázové modely
└── dev.db               # SQLite databáze
```

## Changelog

### 2025-02-11
- Opravena navigace zpět z detailu studenta — tlačítko zpět nyní správně vrací na stránku odkud uživatel přišel (dashboard nebo seznam studentů) pomocí URL parametru `?from=`
