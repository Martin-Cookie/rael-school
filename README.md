# Rael School — Informationssystem
Verwaltungssystem für die Rael-Schule in Kenia. Erfassung von Schülern, Sponsoren, Essensmarken, Gesundheitsuntersuchungen und Zahlungen.

## Schnellstart
```bash
npm install
npm run setup
npm run dev
```
Öffnen Sie **http://localhost:3000**

## Anmeldedaten (Demo)
| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@rael.school | admin123 |
| Manager | manager@rael.school | manager123 |
| Sponsor | sponsor@example.com | sponsor123 |
| Freiwilliger | volunteer@example.com | volunteer123 |

## Technologien
- Next.js 14 (React)
- SQLite + Prisma ORM
- Tailwind CSS
- TypeScript

## Funktionen

### Dashboard (Übersicht)
- Statistiken: Anzahl der Schüler, Sponsoren, Zahlungen, Essensmarken, Bedürfnisse
- Tabellarische Übersicht der Schüler, Sponsoren, Zahlungen, Essensmarken, Bedürfnisse und Klassen
- Spaltensortierung per Klick auf die Spaltenüberschrift

### Schüler
- Schülerliste (Kachelansicht mit Karten)
- Schülerdetail mit Registerkarten:
  - **Persönliche Daten** — Name, Geburtsdatum, Klasse, Geschlecht, Familieninformationen
  - **Ausstattung** — Uniformen, Schuhe, Lernmittel
  - **Bedürfnisse** — Erfassung unerfüllter Bedürfnisse
  - **Essensmarken** — Kauf und Einlösung von Essensmarken
  - **Fotos** — Fotogalerie mit Kategorien
  - **Sponsoren** — zugewiesene Sponsoren
  - **Gesundheitsuntersuchungen** — Untersuchungsaufzeichnungen
  - **Sponsorenzahlungen** — Übersicht der Zahlungen von Sponsoren
- Neuen Schüler hinzufügen
- Bearbeitungsmodus mit Bestätigungsdialog
- Profilbild hochladen

### Sponsoren
- Sponsorenliste
- Sponsorendetail mit zugewiesenen Schülern
- Sponsorensuche

### Zahlungen
- Zahlungserfassung (Schulgeld, Gesundheit, Sonstiges)
- Filterung und Übersicht

### Berichte
- Übersichten und Statistiken

### Administration
- Klassenverwaltung (ClassRooms)
- Verwaltung der Gesundheitsuntersuchungstypen
- Verwaltung der Zahlungstypen

### Weitere Funktionen
- 3 Sprachen: Tschechisch, Englisch, Suaheli
- 4 Benutzerrollen mit unterschiedlichen Berechtigungen (Admin, Manager, Sponsor, Freiwilliger)
- Währungsumschaltung (KES, CZK, USD, EUR)

## Projektstruktur
```
src/
├── app/
│   ├── login/          # Anmeldung
│   ├── dashboard/      # Dashboard (Übersicht)
│   ├── students/       # Schüler (Liste + Detail + Neu)
│   ├── sponsors/       # Sponsoren
│   ├── payments/       # Zahlungen
│   ├── reports/        # Berichte
│   ├── admin/          # Administration
│   └── api/            # REST-API-Endpunkte
├── components/
│   └── layout/
│       └── Sidebar.tsx  # Navigations-Sidebar
├── lib/                 # Hilfsfunktionen (Auth, Formatierung, i18n)
└── messages/            # Sprachdateien (cs, en, sw)
prisma/
├── schema.prisma        # Datenbankmodelle
└── dev.db               # SQLite-Datenbank
```

## Changelog
### 2025-02-11
- Navigation zurück aus der Schülerdetailansicht korrigiert — die Zurück-Schaltfläche leitet den Benutzer nun korrekt zur Seite weiter, von der er gekommen ist (Dashboard oder Schülerliste), mithilfe des URL-Parameters `?from=`
