# Rael School – Vollständige Spezifikation des Informationssystems

> **Dieses Dokument ist die maßgebliche Quelle für das gesamte Projekt.** Es enthält alles, was zur Reproduktion der Anwendung von Grund auf benötigt wird.
> Regeln für die Arbeit mit dem KI-Assistenten befinden sich in der Datei `CLAUDE.md`.

**Repository:** https://github.com/Martin-Cookie/rael-school
**Letzte Aktualisierung:** 11. Februar 2026

## 1. Projektübersicht

Informationssystem für die kenianische Schule **Rael School**, die von tschechischen Sponsoren unterstützt wird. Das System dient zur Erfassung von Schülern, Sponsoren, Zahlungen, Essensmarken, Gesundheitsuntersuchungen und Fotos. Es wird von tschechischen Freiwilligen und Sponsoren, dem kenianischen Schulpersonal sowie Projektmanagern genutzt.

## 2. Technischer Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Datenbank:** SQLite (einfach, eine Datei, keine Serverkonfiguration)
- **ORM:** Prisma
- **CSS:** Tailwind CSS
- **Authentifizierung:** JWT-Token mit httpOnly-Cookies, bcrypt für Passwörter
- **Icons:** lucide-react
- **Datum:** date-fns
- **Lokalisierung:** Eigenes i18n-System mit JSON-Dateien (cs/en/sw)

### Wichtige technische Hinweise

- Next.js 14 verwendet **keinen** `use(params)`-Hook — params in Komponenten sind ein synchrones Objekt `{ params: { id: string } }`, kein `Promise`.
- Alle API-Routen mit denselben params: `{ params }: { params: { id: string } }` (ohne `Promise`, ohne `await`).
- Text in der gesamten Anwendung muss **schwarz (#1a1a1a)** sein für maximale Lesbarkeit.
- Zahlen werden mit **Tausendertrennzeichen** formatiert (1 000 statt 1000).
- Die Anwendung muss für **langsames Internet** optimiert sein (Kenia).
- Auth-Funktion heißt `getCurrentUser()` (nicht `verifyAuth`), importiert aus `@/lib/auth`.
- Toast-Benachrichtigungen verwenden die Funktion `showMsg()` (nicht `showToast`).

## 3. Benutzerrollen und Berechtigungen

| Rolle | Rechte |
|-------|--------|
| **ADMIN** | Vollzugriff, Benutzerverwaltung, Löschen, Administration |
| **MANAGER** | Schüler bearbeiten, Daten hinzufügen, Übersichten |
| **SPONSOR** | Sieht nur eigene zugewiesene Schüler (nur lesen) |
| **VOLUNTEER** | Schüler bearbeiten, Daten hinzufügen |

- Bearbeiten dürfen: ADMIN, MANAGER, VOLUNTEER
- Sponsor sieht nur Schüler, die über die Tabelle Sponsorship zugewiesen sind

## 4. Dreisprachige Oberfläche (i18n)

Drei Sprachen: **Tschechisch (cs)**, **Englisch (en)**, **Suaheli (sw)**. Standardsprache: Tschechisch.

Sprachumschalter auf:
- Anmeldeseite (Flaggen/Kürzel CS/EN/SW)
- Seitenmenü (unterer Bereich)

Die Sprache wird in `localStorage` gespeichert und über `CustomEvent('locale-change')` weitergegeben.

### Vollständige Übersetzungsschlüssel (tschechische Version als Referenz)
```
app.title = Škola Rael
app.subtitle = Informační systém
app.loading = Načítání...
app.save = Uložit
app.cancel = Zrušit
app.edit = Upravit
app.delete = Smazat
app.add = Přidat
app.close = Zavřít
app.confirm = Potvrdit
app.yes = Ano
app.no = Ne
app.back = Zpět
app.search = Hledat...
app.noData = Žádná data
app.actions = Akce
app.confirmSave = Opravdu chcete uložit změny?
app.confirmDelete = Opravdu chcete smazat tento záznam?
app.savedSuccess = Úspěšně uloženo
app.deleteSuccess = Úspěšně smazáno
app.error = Došlo k chybě
app.editMode = Režim úprav
app.viewMode = Režim zobrazení
[... alle weiteren Schlüssel bleiben unverändert als technische Referenz ...]
```

Alle Schlüssel müssen in allen drei Sprachen vorhanden sein (cs, en, sw).

## 5. Datenbankschema

### User
- id (cuid), email (unique), password (bcrypt-Hash), firstName, lastName, phone?, role (ADMIN/MANAGER/SPONSOR/VOLUNTEER), isActive, createdAt, updatedAt
- Relationen: sponsorships[], assignedStudents[], sponsorPayments[], voucherPurchases[] (via "VoucherSponsor")

### Student
- id (cuid), studentNo (unique, Format RAEL-XXX mit Auto-Inkrement), firstName, lastName, dateOfBirth?, gender? (M/F), className?, healthStatus?, profilePhoto? (Dateipfad), motherName?, motherAlive? (boolean), fatherName?, fatherAlive? (boolean), siblings?, isActive, notes?, createdAt, updatedAt

### Equipment
- id, studentId (FK→Student, CASCADE), type (bed/mattress/blanket/mosquito_net), condition (new/satisfactory/poor), acquiredAt?, notes?, createdAt, updatedAt

### Need
- id, studentId (FK→Student, CASCADE), description, isFulfilled (Standard false), fulfilledAt?, notes?, createdAt, updatedAt

### Photo
- id, studentId (FK→Student, CASCADE), category (visit/handover/voucher), fileName, filePath, description?, takenAt (Standard jetzt), createdAt

### VoucherPurchase
- id, studentId (FK→Student, CASCADE), purchaseDate, amount (Float), count (Int), donorName? (legacy), **sponsorId? (FK→User, SET NULL, Relation "VoucherSponsor")**, notes?, createdAt
- Neue Einträge verwenden sponsorId (Dropdown aus Sponsoren), alte Einträge können donorName als Fallback haben

### VoucherUsage
- id, studentId (FK→Student, CASCADE), usageDate, count (Int), notes?, createdAt

### Sponsorship
- id, studentId (FK→Student, CASCADE), userId (FK→User, CASCADE), startDate, endDate?, notes?, isActive, createdAt, updatedAt

### HealthCheck
- id, studentId (FK→Student, CASCADE), checkDate, checkType (dentist/general/urgent), notes?, createdAt, updatedAt

### Payment
- id, studentId? (FK→Student, SET NULL), paymentDate, amount (Float), notes?, source? (manual/bank_import), createdAt

### SponsorPayment
- id, studentId (FK→Student, CASCADE), sponsorId? (FK→User, SET NULL), paymentDate, amount (Float), currency (Standard "KES"), paymentType (tuition/medical/other), notes?, createdAt

### VolunteerAssignment
- id, userId (FK→User, CASCADE), studentId (FK→Student, CASCADE), createdAt, unique(userId+studentId)

### ClassRoom
- id (cuid), name (unique), sortOrder (Int, Standard 0), isActive (Standard true), createdAt

### HealthCheckType
- id (cuid), name (unique), sortOrder (Int, Standard 0), isActive (Standard true), createdAt

### PaymentType
- id (cuid), name (unique), sortOrder (Int, Standard 0), isActive (Standard true), createdAt

## 6. Authentifizierung

### Anmeldeseite (/login)
- Verlaufshintergrund, zentriertes Formular
- E-Mail + Passwort mit Schaltfläche zum Anzeigen/Verbergen
- Sprachumschalter (CS/EN/SW)
- Anzeige der Demo-Anmeldedaten
- Nach erfolgreicher Anmeldung Weiterleitung auf /dashboard

### API
- POST /api/auth/login — Validierung, JWT erstellen, httpOnly-Cookie setzen
- POST /api/auth/logout — Cookie löschen
- GET /api/auth/me — aktuellen Benutzer zurückgeben

### Demo-Konten (Seed-Daten)
- admin@rael.school / admin123 (ADMIN)
- manager@rael.school / manager123 (MANAGER)
- sponsor@example.com / sponsor123 (SPONSOR)
- volunteer@example.com / volunteer123 (VOLUNTEER)

## 7. Layout und Navigation

### Seitenmenü (Sidebar)
- Logo "Škola Rael - Informační systém"
- Einträge (in dieser Reihenfolge):
  1. Übersicht (LayoutDashboard) — alle Rollen
  2. Schüler (Users) — alle Rollen
  3. **Sponsoren (Heart)** — ADMIN, MANAGER, VOLUNTEER (nicht SPONSOR)
  4. Zahlungen (CreditCard) — ADMIN, MANAGER, VOLUNTEER
  5. Statistiken (BarChart3) — ADMIN, MANAGER
  6. Administration (Settings) — nur ADMIN
- Responsiv (Hamburger-Menü auf Mobilgeräten)
- Sprachumschalter unten
- Profil des angemeldeten Benutzers (Name, Rolle mit farbigem Badge)
- Abmelde-Schaltfläche

### Farbschema (kenianisches Motiv)
- Primary: Grün (#16a34a und Abstufungen)
- Accent: Gelb/Orange (#eab308 und Abstufungen)
- Earth: Braun (#92400e und Abstufungen)
- Text: immer #1a1a1a (schwarz)

## 8. Dashboard (/dashboard)

### Anklickbare Statistikkarten (5 Karten in einer Reihe)
1. **Schüler gesamt** → zeigt Schülertabelle
2. **Aktive Sponsoren** → zeigt Sponsorentabelle
3. **Zahlungen von Sponsoren** → zeigt Zahlungsreiter mit Unterreitern (Sponsorenzahlungen / gekaufte Essensmarken)
4. **Schüler mit Handlungsbedarf** → zeigt Schüler mit unerfüllten Bedürfnissen
5. **Klassenübersicht** → zeigt Klassenkarten, Klick auf eine Klasse zeigt Schülerliste

### Zahlungskarte zeigt Summen je Währung
- Das System arbeitet mit 3 Währungen: KES, CZK, EUR (ggf. USD)
- Die Zahlungskarte zeigt die Summe jeder Währung separat: "5 000 KES | 2 000 CZK"
- Essensmarken immer in KES

### Zahlungsreiter hat zwei Unterreiter (Tab-Switcher)
1. **Zahlungen von Sponsoren** — Tabelle: Datum, Typ (Badge), Betrag mit Währung, Schüler (Link), Sponsor, Notiz. Über der Tabelle: farbige Karten mit Summen je Währung.
2. **Gekaufte Essensmarken** — Tabelle: Datum, Betrag, Anzahl, Schüler (Link), Sponsor, Notiz. Über der Tabelle: Gesamtbetrag und Gesamtzahl.

### Standard-Aktivreiter: Schüler
### Aktiver Reiter hat einen farbigen Rahmen entsprechend der Icon-Farbe.

### Alle Tabellen sind sortierbar
- Klick auf Spaltenüberschrift → auf-/absteigende Sortierung
- Pfeilsymbol (ChevronUp/ChevronDown für aktiv, ArrowUpDown für inaktiv)

### Schülertabelle zeigt
- Schülernummer, Nachname (anklickbarer Link zum Detail), Vorname, Klasse, Geschlecht, Anzahl unerfüllter Bedürfnisse (roter Badge), Anzahl Sponsoren (grüner Badge)

### Sponsorentabelle zeigt
- Nachname, Vorname, E-Mail, Telefon, betreute Schüler (anklickbare Badge-Links zum jeweiligen Schüler)

### Klassenübersicht
- Anklickbare Karten mit Klassenname und Schüleranzahl
- Nach Klick auf eine Klasse: Schülertabelle der Klasse mit Link zurück zur Klassenübersicht

## 9. Schülerliste (/students)

- Suche (Echtzeit, 300ms Debounce)
- Karte "Neuen Schüler hinzufügen" → /students/new
- Grid-Layout (1/2/3 Spalten je nach Breite)
- Schülerkarte enthält:
  - **Profilfoto** (runder Avatar links) — falls keines vorhanden, grüner Kreis mit User-Icon
  - Vor- und Nachname
  - Schülernummer
  - Badges: Klasse, Alter, Anzahl Bedürfnisse (rot), Sponsorname (gelb)
- Klick auf Karte → Schülerdetail

## 10. Neuer Schüler (/students/new)

- Formular: Vorname, Nachname, Geburtsdatum, Geschlecht, Klasse, Gesundheitsstatus
- Auto-Generierung der studentNo (RAEL-XXX, wobei XXX die nächste Nummer ist)
- Nach dem Speichern Weiterleitung zum Detail

## 11. Schülerdetail (/students/[id])

### Kopfzeile
- Zurück-Schaltfläche (→ /students)
- **Profilfoto** (runder Avatar 56px) — beim Hover erscheint Kamera-Icon, Klick lädt neues Foto hoch
- Vor- und Nachname
- Untertitel: Schülernummer, Klasse, Alter
- Schaltfläche "Bearbeiten" (nur für ADMIN/MANAGER/VOLUNTEER)

### Bearbeitungsmodus
- Gelbes Banner "Bearbeitungsmodus"
- Schaltflächen Abbrechen / Speichern
- Vor dem Speichern Bestätigungsdialog

### Reiter (in dieser Reihenfolge!)
1. **Persönliche Daten**
2. **Ausstattung**
3. **Bedürfnisse und Wünsche**
4. **Essensmarken**
5. **Fotos**
6. **Sponsoren**
7. **Zahlungen von Sponsoren**
8. **Gesundheitsuntersuchungen**

### 11.1 Persönliche Daten
- Grid 2 Spalten: Vorname, Nachname, Geburtsdatum, Geschlecht (Dropdown M/F), Klasse (Dropdown aus Verzeichnis ClassRoom), Gesundheitsstatus
- Abschnitt Familie: Muttername, Mutter lebt (Ja/Nein Dropdown), Vatername, Vater lebt, Geschwister
- Notizen (Textarea)
- Im Bearbeitungsmodus: Eingabefelder; sonst: Text
- **Klasse ist ein SelectField** — Dropdown lädt Werte aus API `/api/admin/classrooms` (aktive Klassen nach sortOrder)

### 11.2 Ausstattung (eigener Reiter)
- Tabelle: Typ (Bett/Matratze/Decke/Moskitonetz), Zustand (Badge: grün=neu, gelb=befriedigend, rot=schlecht), Anschaffungsdatum
- Im Bearbeitungsmodus: Dropdown für Zustand, Datumsauswahl
- Fehlende Typen werden beim Wechsel in den Bearbeitungsmodus automatisch hinzugefügt

### 11.3 Bedürfnisse und Wünsche (eigener Reiter)
- Schaltfläche "Bedürfnis hinzufügen" (+)
- Inline-Hinzufügen: Texteingabe + Schaltfläche Hinzufügen (Enter = Absenden)
- Jedes Bedürfnis: Checkbox (Klick togglet erfüllt), Beschreibung, Erfüllungsdatum, Papierkorb-Icon zum Löschen
- Grüner Hintergrund = erfüllt (durchgestrichen), roter Hintergrund = unerfüllt
- Bestätigung vor dem Löschen

### 11.4 Essensmarken
- **Währungsauswahl** neben dem Titel (Dropdown: KES, CZK, USD, EUR) — wird in localStorage gespeichert
- Übersichtskarten: Gesamtbetrag, Gesamt gekauft, Gesamt eingelöst, Verfügbar (grün wenn >0, rot wenn ≤0)
- Formular zum Hinzufügen: Typ (Kauf/Einlösung), Datum, Betrag (nur bei Kauf), Anzahl, **Gebername** (Textfeld + Dropdown mit bestehenden Sponsoren des Kindes, Standard = erster Sponsor), Notiz
- **Tabelle Gekauft:** Datum | Betrag | Anzahl | Gebername | Notiz | **Papierkorb-Icon zum Löschen**
- **Tabelle Eingelöst:** Datum | (leerer Spacer) | Anzahl | (leerer Spacer) | Notiz | **Papierkorb-Icon zum Löschen**
- Spalten "Anzahl" in beiden Tabellen müssen **genau untereinander** stehen (daher Spacer)
- Bestätigung vor dem Löschen

### 11.5 Fotos
- Filter: Alle / Aus Besuch / Aus Übergabe / Aus Essensmarke
- Schaltfläche "Foto hochladen"
- Formular: Kategorie, **Aufnahmedatum** (Datumsauswahl), Beschreibung, Dateiauswahl
- Grid 3 Spalten: Vorschau (h-48, object-cover), Beschreibung, Datum, Kategorie-Badge
- **Lösch-Schaltfläche** (Papierkorb-Icon) bei jedem Foto
- Dateien werden gespeichert unter public/uploads/{studentId}/

### 11.6 Sponsoren
- **Bestehenden Sponsor suchen** — Toggle-Schaltfläche mit Lupe, öffnet Sucheingabe mit Autocomplete-Dropdown (Suche nach Nachname über `/api/sponsors/search`)
- Schaltfläche "Sponsor hinzufügen" — Formular: Vorname*, Nachname*, E-Mail*, Telefon, Startdatum, Notiz
- Wenn kein Sponsor mit der E-Mail im System vorhanden, wird automatisch ein neuer User mit Rolle SPONSOR und Standardpasswort "sponsor123" erstellt
- Wenn vorhanden, wird nur die Sponsorship-Verknüpfung erstellt
- Verhinderung doppelter aktiver Sponsorschaften
- Jeder Sponsor zeigt: Avatar, Name, E-Mail, Telefon, Startdatum, Notiz, Status (Aktiv/Inaktiv Badge)
- **Bearbeiten-Schaltfläche** (Stift-Icon) — öffnet Inline-Formular: Vorname, Nachname, **E-Mail** (bearbeitbar!), Telefon, Notiz
- **Sponsor entfernen** (Papierkorb-Icon) — Hard-Delete der Sponsorship mit Bestätigung
- Gelber Kartenhintergrund (accent-50)

### 11.7 Zahlungen von Sponsoren
- Schaltfläche "Hinzufügen"
- Formular: Datum, Zahlungstyp (**dynamisches Dropdown** aus Verzeichnis PaymentType in der Administration), Betrag + Währungsauswahl (KES/CZK/EUR/USD), **Sponsor (Dropdown aus ALLEN aktiven Sponsoren, geladen von `/api/sponsors`)**, Notiz
- Tabelle: Datum, Typ (farbiges Badge: grün=Schulgeld, gelb=Arzt, rot=Sonstiges), Betrag mit Währung, Sponsor, Notiz, Papierkorb-Icon zum Löschen
- Bestätigung vor dem Löschen

### 11.8 Gesundheitsuntersuchungen
- Schaltfläche "Untersuchung hinzufügen"
- Formular: Datum, Typ (**dynamisches Dropdown** aus Verzeichnis HealthCheckType in der Administration), Notiz
- Tabelle: Datum (w-28) | Untersuchungstyp (w-24, farbiges Badge) | Notiz (restlicher Platz) | Papierkorb-Icon
- **Untersuchungstyp linksbündig** damit die Notiz maximalen Platz hat
- Bestätigung vor dem Löschen

## 12. Seite Sponsoren (/sponsors)

### Zugriff
- ADMIN, MANAGER, VOLUNTEER (nicht SPONSOR)
- In der Sidebar: Eintrag "Sponsoren" (Heart-Icon) zwischen Schüler und Zahlungen

### UI: Card-basiertes Layout
- Suche mit Echtzeit-Filterung
- Schaltfläche "Sponsor hinzufügen" (erstellt User mit Rolle SPONSOR, Standardpasswort "sponsor123")
- Prüfung auf Eindeutigkeit der E-Mail (bietet Reaktivierung an, wenn inaktiver Sponsor vorhanden)

### Sponsorenkarte enthält:
- Avatar (Initialen)
- Vor- und Nachname, E-Mail, Telefon (inline bearbeitbar)
- Liste zugewiesener Schüler (anklickbare Links zum Detail)
- Gesamtzahlungen gruppiert nach Währungen (KES, CZK, USD, EUR)
- Schaltfläche Deaktivieren/Reaktivieren (ADMIN/MANAGER) — Deaktivierung beendet alle aktiven Sponsorschaften
- Inaktive Sponsoren: roter Rahmen + Badge "Inaktiv"

### API-Endpunkte
- **GET /api/sponsors** — Liste mit Zahlungen je Währung, ?search=, ?includeInactive=true
- **POST /api/sponsors** — neuen Sponsor erstellen (User mit Rolle SPONSOR)
- **GET /api/sponsors/[id]** — Detail mit Verknüpfungen und Zahlungen
- **PUT /api/sponsors/[id]** — Info bearbeiten (Name, E-Mail, Telefon)
- **PATCH /api/sponsors/[id]** — isActive umschalten
- **GET /api/sponsors/search?q=** — Autocomplete-Suche nach Nachname (top 10)

## 13. Seite Zahlungen (/payments) — CRUD

Vollwertige Seite mit zwei Reitern und vollständigem CRUD:

### Tab-Switcher mit Icons
1. **Zahlungen von Sponsoren** (CreditCard-Icon) — Anzahl in Klammern
2. **Gekaufte Essensmarken** (Ticket-Icon) — Anzahl in Klammern

### Reiter "Zahlungen von Sponsoren"
- Über der Tabelle: farbige Karten mit Summen je Währung (jede Währung separat: KES, CZK, EUR...)
- **Zahlung hinzufügen** (Schaltfläche +): Formular mit Dropdown für Schüler, Sponsor, Zahlungstyp (aus Verzeichnis), Währung, Betrag, Datum, Notiz
- **Bearbeiten** (Stift-Icon, sichtbar beim Hover): Inline-Bearbeitung in der Tabellenzeile mit Selects und Inputs
- **Löschen** (Papierkorb-Icon, sichtbar beim Hover): mit Bestätigungsdialog
- Tabelle: Datum, Zahlungstyp (Badge), Betrag mit Währung, Schüler (Link), Sponsor, Notiz, Aktionen

### Reiter "Gekaufte Essensmarken"
- Über der Tabelle: Gesamtbetrag (KES) und Gesamtzahl der Essensmarken
- **Essensmarke hinzufügen** (Schaltfläche +): Formular mit Dropdown für Schüler, **Sponsor (Dropdown aller Sponsoren, kein donorName-Textfeld)**, Datum, Betrag, Anzahl, Notiz
- **Bearbeiten** (Stift-Icon): Inline in der Zeile, **Sponsor als Dropdown**
- **Löschen** (Papierkorb-Icon): mit Bestätigungsdialog
- Tabelle: Datum, Betrag, Anzahl, Schüler (Link), **Sponsor (zeigt Name, Fallback auf donorName für alte Einträge)**, Notiz, Aktionen

### API-Endpunkt
- **POST /api/payments** — Erstellen (type: 'sponsor' | 'voucher')
- **PUT /api/payments** — Bearbeiten (type + id)
- **DELETE /api/payments** — Löschen (type + id)

Daten werden von `/api/dashboard` geladen (gemeinsamer Endpunkt, voucherPurchases include sponsor).

## 14. Administration (/admin) — nur ADMIN

### Navigation
- In der Sidebar: Eintrag "Administration" (Settings-Icon), nur für ADMIN sichtbar
- Auf der Seite: Zurück-Schaltfläche (Pfeil → Dashboard)

### Seitenaufbau — ausklappbares Akkordeon
Die Seite enthält **3 ausklappbare Abschnitte** (Akkordeon). Jeder Abschnitt hat:
- Anklickbare Überschrift mit Pfeil-Icon (ChevronRight, rotiert 90° beim Öffnen)
- Abschnittsname + Anzahl aktiver Einträge in Klammern
- Klick auf Überschrift klappt Abschnitt auf/zu
- Standardzustand: **Klassenverzeichnis** ist ausgeklappt, andere eingeklappt

### Wiederverwendbare Komponente CodelistSection
Alle drei Abschnitte teilen eine generische Komponente `CodelistSection` mit Eigenschaften:
- `title`, `icon`, `items`, `newItemName`, `onAdd`, `onDelete`, `onMove`
- Generisches CRUD-Factory-Pattern `makeHandlers(endpoint, items)` für DRY-Code

### Abschnitt 1: Klassenverzeichnis (GraduationCap-Icon)
- **Hinzufügen:** Texteingabe + Schaltfläche "Hinzufügen" (Enter = Absenden)
- **Klassenliste:** jede Klasse = Zeile mit:
  - Pfeile hoch/runter (ChevronUp/ChevronDown) zum Ändern der Reihenfolge
  - GraduationCap-Icon + Klassenname
  - Papierkorb-Icon zum Löschen (sichtbar beim Hover)
- **Löschen:** Soft-Delete (isActive=false), bei Hinzufügen desselben Namens wird vorhandener Eintrag reaktiviert
- **Sortierung:** PUT-Endpunkt aktualisiert sortOrder aller Klassen auf einmal

### Abschnitt 2: Arten der Gesundheitsuntersuchungen (Heart-Icon)
- Gleiche UI wie Klassenverzeichnis (hinzufügen, löschen, Pfeile zur Sortierung)
- Soft-Delete mit Reaktivierung
- Standard-Seed-Daten: Allgemeinmediziner, Zahnarzt, Augenarzt, Notfall
- Verwendung: Dropdown im Reiter "Gesundheitsuntersuchungen" im Schülerdetail

### Abschnitt 3: Zahlungstypen von Sponsoren (CreditCard-Icon)
- Gleiche UI wie Klassenverzeichnis (hinzufügen, löschen, Pfeile zur Sortierung)
- Soft-Delete mit Reaktivierung
- Standard-Seed-Daten: Schulgeld, Arzt, Uniform, Schulbücher, Sonstiges
- Verwendung: Dropdown im Reiter "Zahlungen von Sponsoren" im Schülerdetail und auf der Zahlungsseite

### API-Endpunkte für Verzeichnisse
Alle drei teilen dasselbe Muster (GET/POST/PUT/DELETE, nur ADMIN):

- **/api/admin/classrooms** — CRUD für Klassen
- **/api/admin/health-types** — CRUD für Arten der Gesundheitsuntersuchungen
- **/api/admin/payment-types** — CRUD für Zahlungstypen von Sponsoren

Jeder Endpunkt unterstützt:
- GET: aktive Einträge nach sortOrder sortiert
- POST: neuen Eintrag erstellen (wenn inaktiver Eintrag mit gleichem Namen vorhanden → Reaktivierung)
- PUT: Batch-Update von sortOrder (Neuordnung)
- DELETE: Soft-Delete (isActive=false)

## 15. API-Endpunkte — vollständige Übersicht

### Authentifizierung
- POST /api/auth/login — Anmeldung
- POST /api/auth/logout — Abmeldung
- GET /api/auth/me — aktueller Benutzer

### Dashboard
- GET /api/dashboard — Stats (sponsorPaymentsByCurrency, voucherTotalAmount) + sponsorPayments (include student+sponsor) + voucherPurchases (include student+sponsor) + students (_count) + sponsors (sponsorships+student) + studentsWithNeeds

### Schüler
- GET /api/students — Liste mit Suche und Filterung
- POST /api/students — Erstellen mit auto-generierter studentNo
- GET /api/students/[id] — Detail mit allen Relationen
- PUT /api/students/[id] — Persönliche Daten aktualisieren
- DELETE /api/students/[id] — Soft-Delete (isActive=false), nur ADMIN
- PUT /api/students/[id]/equipment — Batch-Update der Ausstattung
- POST /api/students/[id]/needs — Bedürfnis hinzufügen
- PUT /api/students/[id]/needs — Erfüllt umschalten
- DELETE /api/students/[id]/needs — Bedürfnis löschen
- POST /api/students/[id]/vouchers — Kauf oder Einlösung hinzufügen
- DELETE /api/students/[id]/vouchers — Kauf oder Einlösung löschen (query: type=purchase|usage)
- POST /api/students/[id]/health — Untersuchung hinzufügen
- DELETE /api/students/[id]/health — Untersuchung löschen
- POST /api/students/[id]/photos — Foto hochladen (FormData: file, category, description, takenAt)
- DELETE /api/students/[id]/photos — Foto löschen (+ Datei von Festplatte löschen)
- POST /api/students/[id]/sponsors — Sponsor hinzufügen (find or create User)
- PUT /api/students/[id]/sponsors — Sponsor bearbeiten (inkl. E-Mail)
- DELETE /api/students/[id]/sponsors — Hard-Delete der Sponsorship
- POST /api/students/[id]/sponsor-payments — Sponsorenzahlung hinzufügen
- DELETE /api/students/[id]/sponsor-payments — Zahlung löschen

### Sponsoren
- GET /api/sponsors — Liste mit Zahlungen je Währung (?search=, ?includeInactive=true)
- POST /api/sponsors — neuen Sponsor erstellen
- GET /api/sponsors/[id] — Detail
- PUT /api/sponsors/[id] — bearbeiten
- PATCH /api/sponsors/[id] — isActive umschalten
- GET /api/sponsors/search?q= — Autocomplete (top 10)

### Zahlungen (CRUD)
- POST /api/payments — Erstellen (type: sponsor | voucher)
- PUT /api/payments — Bearbeiten (type + id)
- DELETE /api/payments — Löschen (type + id)

### Admin
- GET/POST/PUT/DELETE /api/admin/classrooms
- GET/POST/PUT/DELETE /api/admin/health-types
- GET/POST/PUT/DELETE /api/admin/payment-types

## 16. Toast-Benachrichtigungen

- Erfolg: grüner Toast oben rechts, verschwindet automatisch nach 3 Sekunden
- Fehler: roter Toast oben rechts, verschwindet automatisch nach 3 Sekunden
- Funktion: `showMsg('success' | 'error', text)`

## 17. Bestätigungsdialoge

- Vor dem Speichern persönlicher Daten: modaler Dialog "Möchten Sie die Änderungen wirklich speichern?" mit Schaltflächen Abbrechen/Speichern
- Vor dem Löschen von allem: `confirm()`-Dialog

## 18. Seed-Daten (Testdaten)

### Benutzer
- Admin Rael (admin@rael.school / admin123) — ADMIN
- Manager Rael (manager@rael.school / manager123) — MANAGER
- Jana Nová (sponsor@example.com / sponsor123) — SPONSOR
- Freiwilliger Karel (volunteer@example.com / volunteer123) — VOLUNTEER

### Schüler (5 Testschüler)
- RAEL-001 Amani Mwangi — vollständige Daten (Ausstattung, Bedürfnisse, Essensmarken, Sponsor, Gesundheitsuntersuchungen, Zahlungen)
- RAEL-002 Zawadi Omondi
- RAEL-003 Jabari Kimani
- RAEL-004 Nia Wanjiku
- RAEL-005 Kofi Mutua

### Verzeichnisse (Seed-Daten)
- **Klassen:** definiert in seed.ts
- **Arten der Gesundheitsuntersuchungen:** Allgemeinmediziner, Zahnarzt, Augenarzt, Notfall
- **Zahlungstypen von Sponsoren:** Schulgeld, Arzt, Uniform, Schulbücher, Sonstiges

## 19. Visueller Stil

- Abgerundete Ecken (rounded-xl, rounded-2xl)
- Karten mit border-gray-200 und Hover-Effekt (card-hover: translateY(-2px), größerer Schatten)
- Badge-Stile: badge-green (grün), badge-yellow (gelb), badge-red (rot)
- Verlauf-Anmeldeseite (from-primary-600 to-primary-800)
- Custom-Scrollbar-Styling
- Lade-Spinner: border-Animation
- Gesamter Text #1a1a1a (erzwungen in globals.css über *, body, p, span, h1-h6)
- Bearbeiten und Löschen in Tabellen: Icons sichtbar beim Hover über der Zeile (opacity-0 → group-hover:opacity-100)

## 20. Dateistruktur
```
rael-school/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/uploads/          (Schülerfotos)
│   └── profiles/            (Profilfotos)
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx         (Weiterleitung auf /login)
│   │   ├── login/page.tsx
│   │   ├── admin/page.tsx   (Verzeichnisse — nur ADMIN)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── students/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx     (Liste)
│   │   │   ├── new/page.tsx (neuer Schüler)
│   │   │   └── [id]/page.tsx (Detail)
│   │   ├── sponsors/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx     (Sponsorenverwaltung)
│   │   ├── payments/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx     (CRUD Zahlungen und Essensmarken)
│   │   ├── reports/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx     (Platzhalter)
│   │   └── api/
│   │       ├── auth/{login,logout,me}/route.ts
│   │       ├── admin/classrooms/route.ts
│   │       ├── admin/health-types/route.ts
│   │       ├── admin/payment-types/route.ts
│   │       ├── dashboard/route.ts
│   │       ├── payments/route.ts          (CRUD für Zahlungen)
│   │       ├── sponsors/
│   │       │   ├── route.ts               (GET/POST)
│   │       │   ├── [id]/route.ts          (GET/PUT/PATCH)
│   │       │   └── search/route.ts        (GET Autocomplete)
│   │       └── students/
│   │           ├── route.ts
│   │           └── [id]/
│   │               ├── route.ts
│   │               ├── equipment/route.ts
│   │               ├── needs/route.ts
│   │               ├── vouchers/route.ts
│   │               ├── health/route.ts
│   │               ├── photos/route.ts
│   │               ├── sponsors/route.ts  (POST/PUT/DELETE)
│   │               ├── sponsor-payments/route.ts
│   │               └── profile-photo/ts
│   ├── components/layout/Sidebar.tsx
│   ├── lib/
│   │   ├── db.ts            (Prisma-Singleton)
│   │   ├── auth.ts          (JWT, bcrypt, getCurrentUser, canEdit)
│   │   ├── i18n.ts          (createTranslator, Punktnotation, Interpolation)
│   │   └── format.ts        (formatNumber, formatCurrency, formatDate, formatDateForInput, calculateAge)
│   └── messages/
│       ├── cs.json
│       ├── en.json
│       └── sw.json
├── .env                     (DATABASE_URL, JWT_SECRET)
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

## 21. Installationsanleitung
```bash
npm install
npm run setup    # = prisma generate + db push + seed
npm run dev
```

Anwendung läuft unter http://localhost:3000

## 22. Wichtige UX-Regeln

1. Gesamter Text in der Anwendung muss schwarz sein (#1a1a1a) — kein grauer Text für Hauptinhalt
2. Zahlen mit Tausendertrennzeichen formatieren (Leerzeichen)
3. Währung wird nach der Zahl angezeigt: "1 500 KES"
4. Datum nach Locale formatieren (de: "12.01.2025", en: "12/01/2025")
5. Alter wird aus dem Geburtsdatum berechnet und als "X Jahre/years/miaka" angezeigt
6. Bestätigungsdialoge vor jedem Löschen
7. Toast-Benachrichtigungen nach jeder Aktion (Speichern/Löschen) — Funktion `showMsg()`
8. Bearbeitungsmodus-Indikator (gelbes Banner)
9. Responsives Design (Mobil, Tablet, Desktop)
10. Leere Zustände: Icon + Text "Keine Daten" zentriert
11. Zahlungen von Sponsoren nach Währungen aggregieren (KES, CZK, EUR separat)
12. Essensmarken immer in KES
13. Sponsor-Dropdown in Zahlungen lädt immer ALLE aktiven Sponsoren (nicht nur dem Schüler zugewiesene)
14. Sponsor von Schüler entfernen = Hard-Delete der Sponsorship (kein Soft-Delete)

## 23. Aktueller Projektstand

### Abgeschlossene Phasen (Phase 1–9)
- ✅ Authentifizierung und Rollen (JWT, 4 Rollen)
- ✅ Layout, Navigation, Sidebar mit Sprachumschalter
- ✅ Dashboard mit anklickbaren Karten und Reitern
- ✅ Schülerliste (Grid, Suche, Karten)
- ✅ Schülerdetail (8 Reiter: Persönliche Daten, Ausstattung, Bedürfnisse, Essensmarken, Fotos, Sponsoren, Zahlungen von Sponsoren, Gesundheitsuntersuchungen)
- ✅ Neuer Schüler mit Auto-Nummernvergabe
- ✅ Dreisprachige Oberfläche (cs/en/sw)
- ✅ Admin-Verzeichnisse (Klassen, Untersuchungsarten, Zahlungstypen)
- ✅ Seite Sponsoren (/sponsors) — CRUD, Deaktivierung/Reaktivierung
- ✅ Seite Zahlungen (/payments) — CRUD für Sponsorenzahlungen und Essensmarken

### Noch nicht implementiert
- ❌ Statistiken (/reports) — aktuell Platzhalter
- ❌ Import von Bankzahlungen
- ❌ Deployment / Produktivbetrieb

### Bekannte Probleme
_(Hier bekannte Bugs oder Mängel eintragen)_

## 24. Versionshistorie

| Version | Datum | Änderungen |
|---------|-------|------------|
| v1 | 08.02.2026 | Erste Spezifikation (Phase 1–6) |
| v2 | 10.02.2026 | Phase 7–8: Admin-Verzeichnisse (Klassen, Untersuchungsarten, Zahlungstypen) |
| v3 | 10.02.2026 | Phase 9: Sponsorenseite, Zahlungen CRUD, Sponsor-Dropdown für Essensmarken, Bugfixes |
| v4 | 11.02.2026 | Umstieg auf Claude Code: Trennung von CLAUDE.md und Spezifikation, Projektstatus hinzugefügt |
