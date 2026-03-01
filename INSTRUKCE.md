# Rael School — Informationssystem

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
```

## Installation und Start
```bash
npm install
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
