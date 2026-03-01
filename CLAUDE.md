# Projektregeln

## Workflow für Codeänderungen

1. **Codeänderung vornehmen** gemäß Benutzeranweisung
2. **Committen und pushen** auf GitHub (damit der Benutzer die Änderungen herunterladen kann)
3. **Dem Benutzer einen kombinierten Befehl senden** zum Aktualisieren und Neustart auf dem lokalen Computer:
```bash
   git pull origin <aktueller-branch> && npm run dev
```
   (Der Benutzer beendet den Server vorher selbst mit Ctrl+C.)
4. **Warten**, bis der Benutzer die Änderungen lokal getestet hat
5. Falls etwas nicht stimmt, **korrigieren und erneut pushen**

## Dokumentation

- Nach jedem Commit und Push auf GitHub die Projektdokumentation aktualisieren.

## Lokale Umgebung des Benutzers

- **Hauptbranch lokal ist `main`** (nicht `master`)
- Beim Mergen in den Hauptbranch immer `main` verwenden

## Allgemeine Regeln

- **VOR jeder Bearbeitung immer die aktuelle Dateiversion von der Festplatte lesen** — nie aus dem Gedächtnis oder aus einem früheren Gespräch arbeiten
- Bei Unsicherheit nachfragen
- Bei umfangreicheren Änderungen schrittweise vorgehen

## Technischer Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Datenbank:** SQLite + Prisma ORM
- **CSS:** Tailwind CSS
- **Authentifizierung:** JWT (httpOnly-Cookies) + bcrypt
- **Icons:** lucide-react
- **Lokalisierung:** Eigenes i18n (cs/en/sw)
- **Dark Mode:** Tailwind `dark:`-Klassen + CSS-Variablen, Umschalten in der Sidebar (Moon/Sun-Icon)

## Kritische technische Konventionen

- Next.js 14 **VERWENDET NICHT** den `use(params)`-Hook — params sind ein synchrones Objekt `{ params: { id: string } }`, kein Promise
- Auth-Funktion: `getCurrentUser()` aus `@/lib/auth`
- Toast-Benachrichtigungen: `showMsg('success' | 'error', text)`
- Zahlen mit Tausendertrennzeichen (Leerzeichen) formatieren: `1 000` nicht `1000`
- Währung nach der Zahl: `1 500 KES`
- Essensmarken immer in KES
- Essensmarkensatz (Preis pro 1 Essensmarke) ist per Währung in der Administration konfigurierbar (`VoucherRate`-Modell), Standard 80 CZK
- Konstanten `CURRENCIES = ['CZK', 'EUR', 'USD', 'KES']` — vordefinierte Währungen für Dropdowns
- Jeder neue UI-Text muss einen Schlüssel in **allen drei** Sprachen haben (cs, en, sw)

## UI-Muster

### Tabellensortierung (SortHeader-Pattern)

Alle Hauptseiten mit Listen verwenden ein einheitliches sortierbares Tabellenmuster:

- **`handleSort(col)`** — wechselt asc/desc oder setzt neue Spalte
- **`sortData(data, col)`** — sortiert Array nach Spalte (Zahlen numerisch, Strings alphabetisch, `_count.*` für Prisma-Relationen)
- **`SH`-Komponente** — sortierbarer `<th>`-Header mit Pfeilen (ChevronUp/ChevronDown/ArrowUpDown)

Seiten mit diesem Muster:
| Seite | Datei | Spalten |
|-------|-------|---------|
| Übersicht | `dashboard/page.tsx` | Schüler, Sponsoren, Zahlungen, Bedürfnisse, Klassen |
| Schüler | `students/page.tsx` | Nummer, Nachname, Vorname, Klasse, Geschlecht, Alter, Bedürfnisse, Sponsoren |
| Sponsoren | `sponsors/page.tsx` | Nachname, Vorname, E-Mail, Telefon, Schüler, Zahlungen |
| Klassen | `classes/page.tsx` | Klassenkarten (natürliche Sortierung PP1→Grade 12) + Klassendetail mit Schülern |
| Zahlungen – Sponsor | `payments/page.tsx` | Datum, Typ, Betrag, Schüler, Sponsor, Notizen |
| Zahlungen – Essensmarken | `payments/page.tsx` | Kaufdatum, Betrag, Anzahl, Schüler, Sponsor, Notizen |
| Import-Detail | `payments/import/[id]/page.tsx` | Datum, Betrag, Währung, Schüler, Sponsor, Typ, Status |
| Schulgebührenbescheide | `tuition/page.tsx` | Schüler, Klasse, Betrag, Bezahlt, Verbleibend, Status |

### Sticky-Layout für Listen

Alle Hauptlisten (Schüler, Sponsoren, Zahlungen, Übersicht) verwenden ein zweistufiges Sticky-Layout:

**1. Sticky-Header (z-30)** — Titel + Suche/Schaltflächen, immer oben:
```
sticky top-16 lg:top-0 z-30 bg-[#fafaf8] pb-4 -mx-6 px-6 lg:-mx-8 lg:px-8
```
- `top-16` = unter mobilem Header (64px), `lg:top-0` = auf Desktop oben
- Negativer Margin + Padding = Hintergrund bis zum Rand (kompensiert Eltern-Padding)

**2. Sticky thead (z-20)** — Zeile mit Sortier-Headern, unter dem Sticky-Header:
```tsx
<tr className="... bg-white sticky z-20" style={{ top: theadTop }}>
```
- `theadTop` = dynamisch gemessene Höhe des Sticky-Headers + mobiler Offset
- Gemessen über `useRef` + `ResizeObserver` + `window resize` Listener
- Dependency `[loading]` — auf Seiten mit frühem `if (loading) return` wird ref erst nach dem Laden gefüllt

**Wichtig:**
- Tabellen dürfen NICHT in `overflow-hidden` oder `overflow-x-auto` eingewickelt sein — diese CSS-Eigenschaften erstellen einen neuen Scroll-Kontext und deaktivieren `position: sticky`
- thead-Hintergrund muss undurchsichtig sein (`bg-white` oder `bg-gray-50`, nicht `bg-gray-50/50`)

**Ohne Paginierung** — alle Einträge werden auf einmal angezeigt (vollständige Daten werden aus der API geladen)

### Dashboard — Klassenübersicht und Cross-Tab-Navigation

**Klassenübersicht (Reiter Klassen):**
- Statt Tabelle werden **Karten/Blasen** in einem Grid angezeigt (2→3→4 Spalten je nach Breite)
- Natürliche Sortierung: PP1, PP2, Grade 1, Grade 2, …, Grade 12
- Klick auf Karte → Klassendetail mit Schülerliste

**Cross-Tab-Navigation (anklickbare Klassennamen):**
- In den Reitern **Schüler** und **Bedürfnisse** ist der Klassenname anklickbar
- Klick wechselt zum Reiter Klassen mit dem Detail der jeweiligen Klasse
- Zurück-Schaltfläche kehrt zum **Quellreiter** zurück (nicht zur Klassenübersicht) — implementiert über `useRef<DashTab>` (`prevTabRef`)
- Falls Benutzer direkt von der Klassenübersicht kam, kehrt Zurück zum Klassen-Grid zurück

**Karte Schüler gesamt:**
- Unter der Hauptzahl wird die Anzahl der Jungen / Mädchen angezeigt

### Schülerdetail — Reiter

Datei: `src/app/students/[id]/page.tsx`

9 Reiter in dieser Reihenfolge:

| # | Reiter | Schlüssel | Farbe | Icon |
|---|--------|-----------|-------|------|
| 1 | Persönliche Daten | `personal` | gray | User |
| 2 | Sponsoren | `sponsors` | accent | HandHeart |
| 3 | Ausstattung | `equipment` | amber | Package |
| 4 | Bedürfnisse | `needs` | rose | Heart |
| 5 | Wünsche | `wishes` | violet | Star |
| 6 | Essensmarken | `vouchers` | blue | Ticket |
| 7 | Zahlungen von Sponsoren | `sponsorPayments` | indigo | CreditCard |
| 8 | Gesundheit | `health` | teal | Stethoscope |
| 9 | Fotos | `photos` | slate | Camera |

### Besuchskarten (Visit Cards) — Drucklayout

Datei: `src/app/reports/visit-cards/print/page.tsx`

Zweiseitiges A4-Formular pro Schüler (Seitenhöhe `calc(297mm - 16mm)`):

| Seite | Abschnitte |
|-------|------------|
| 1 | Header, Sponsoren, Grundinfo (Klasse, Schule, Geburtsdatum, Geschlecht, Waisenstatus, Gesundheit), Familie, Ausstattung |
| 2 | Bedürfnisse, Wünsche, Allgemeine Notizen (flex-fill bis Seitenende) |

**Layout der Abschnitte auf Seite 2:**

| Abschnitt | Layout |
|-----------|--------|
| Bedürfnisse | CSS-Grid 3 Spalten — Checkbox + Name + Preis (ohne individuelle Notizen) |
| Wünsche | CSS-Grid 3 Spalten — Checkbox + Name + Preis (ohne individuelle Notizen) |
| Allgemeine Notizen | flex-fill bis Seitenende |

**Layout der Ausstattungstabelle (Seite 1, colgroup + table-fixed):**

| Abschnitt | Spalten (Breiten) |
|-----------|------------------|
| Ausstattung | Checkbox 4%, Typ 22%, Zustand 11%, Preis 8%, Notizen 55% |

- Druck über iframe (isolierter HTML-Snapshot unabhängig vom React-Lifecycle)
- Notizfeld auf Seite 2 dehnt sich automatisch bis Seitenende (flex: 1)
- Preise aus Verzeichnissen `needTypes`, `wishTypes`, `equipmentTypes` (API `/api/reports/visit-cards`)

### Administration der Verzeichnisse — Auto-Übersetzung

Dateien:
- UI: `src/app/admin/page.tsx` (Komponente `CodelistSection`)
- Translate-Endpunkt: `src/app/api/admin/translate/route.ts`

**Neuen Eintrag mit Übersetzung hinzufügen:**
1. Admin gibt tschechischen Namen ein
2. Klickt Globe-Schaltfläche → öffnet EN/SW-Felder + startet Auto-Übersetzung (MyMemory API)
3. Erneuter Klick auf Globe → versteckt Übersetzungsfelder und löscht Werte
4. Nach Klick auf "Hinzufügen" werden die Felder automatisch ausgeblendet

**Layout des Eingabeformulars:**
```
[ Tschechischer Name (volle Breite)  ] [ 🌐 ]
[ Preis ]                  ← nur bei Verzeichnissen mit Preis
[ EN: Auto-Übersetzung                      ]
[ SW: Auto-Übersetzung                      ]
[        + Hinzufügen      |   Abbrechen    ]
```

- Name + Globe sind in einer Zeile, Preis in einer separaten Zeile darunter
- Übersetzungsfelder sind **vertikal untereinander** (nicht nebeneinander)
- Globe-Schaltfläche ist ein **Toggle** mit visueller Hervorhebung des aktiven Zustands (blauer Rahmen)
- Globe-Schaltfläche hat `flex-shrink-0` — läuft nicht über den Kartenrand
- Schaltfläche **Abbrechen** erscheint, sobald der Benutzer beginnt auszufüllen — setzt Name, Preis und Übersetzungen zurück

**Bearbeitung von Namen bestehender Einträge:**
- Klick auf Eintragsname → Inline-Texteingabe (Click-to-Edit)
- Enter oder Blur speichert Änderung über PUT-Endpunkt (`body.name`)
- Escape bricht Bearbeitung ab
- Stift (Pencil) erscheint beim Hover über dem Eintrag

**Bearbeitung von Übersetzungen bei bestehenden Einträgen:**
- Globe-Icon in der Eintragszeile (sichtbar beim Hover)
- Klick öffnet Inline-EN/SW-Inputs unter dem Eintrag (vertikal)
- Speichern über PUT-Endpunkt (Enter oder Speichern-Schaltfläche)

**Translate-Endpunkt:**
- `POST /api/admin/translate` — empfängt `{ text }`, gibt `{ en, sw }` zurück
- Zwei parallele MyMemory-API-Aufrufe (`cs|en`, `cs|sw`) über `Promise.allSettled`
- Timeout 5s, erfordert Authentifizierung

### Essensmarkensätze (VoucherRate)

Dateien:
- UI: `src/app/admin/page.tsx` (Komponente `VoucherRateSection`)
- Admin CRUD API: `src/app/api/admin/voucher-rates/route.ts`
- Öffentliches Lesen: `src/app/api/voucher-rates/route.ts`
- Prisma-Modell: `VoucherRate` (currency unique, rate, isActive)

**Konfiguration:**
- Satz = Preis von 1 Essensmarke in der jeweiligen Währung (z.B. CZK = 80, EUR = 3, USD = 3.5, KES = 80)
- Währungen aus Dropdown der vordefinierten Währungen (`CURRENCIES`) wählbar, kein Freitext
- Wenn alle Währungen eingerichtet sind, wird das Formular ausgeblendet und ein Infotext angezeigt

**Verwendung der Sätze:**
| Ort | Datei | Beschreibung |
|-----|-------|--------------|
| Schülerdetail – Reiter Essensmarken | `students/[id]/page.tsx` | Auto-Berechnung der Essensmarkenanzahl aus Betrag und Währung |
| Zahlungen – Essensmarkenkauf hinzufügen | `payments/page.tsx` | Auto-Berechnung + Platzhalter mit aktuellem Satz |
| Import – Split-Modal | `payments/import/[id]/page.tsx` | Vorausfüllung der Essensmarkenanzahl |
| Import – Approve-Endpunkt | `api/payment-imports/[id]/approve/route.ts` | Berechnung der Essensmarkenanzahl auf dem Server |
| Import – Split-Endpunkt | `api/payment-imports/[id]/rows/[rowId]/split/route.ts` | Berechnung der Essensmarkenanzahl auf dem Server |

**Fallback:** Falls für die jeweilige Währung kein Satz vorhanden ist, verwenden Server-Endpunkte Fallback `80`.

### Import von Kontoauszügen — Split und Genehmigung von Zahlungen

Dateien:
- Import-Detail UI: `src/app/payments/import/[id]/page.tsx`
- Split-Endpunkt: `src/app/api/payment-imports/[id]/rows/[rowId]/split/route.ts`
- Approve-Endpunkt: `src/app/api/payment-imports/[id]/approve/route.ts`

**Split-Flow (Zahlung auf Teile aufteilen):**
1. Benutzer klickt "Aufteilen" bei einer Import-Zeile
2. Im Modal-Fenster werden Beträge, Schüler und Zahlungstyp für jeden Teil festgelegt (bei Essensmarken wird ein Feld für die Anzahl angezeigt, vorausgefüllt aus `VoucherRate`-Verzeichnis)
3. Split-Endpunkt erstellt Kind-Zeilen (`parentRowId` → Eltern-Zeile, Status `SPLIT`)
4. **Auto-Approve:** Wenn eine Kind-Zeile `studentId` + `paymentTypeId` ausgefüllt hat, wird sie automatisch genehmigt und VoucherPurchase oder SponsorPayment erstellt
5. Kind-Zeilen ohne vollständige Angaben bleiben als PARTIAL/NEW → werden manuell über Approve genehmigt

**VoucherPurchase aus Bankimport:**
- Setzt `sponsorId` (Relation) und `donorName` (Textfeld) — Schülerdetail zeigt `v.donorName`, Zahlungsseite zeigt `v.sponsor` mit Fallback auf `v.donorName`
- Essensmarkenerkennung: `paymentType.name` enthält "stravenk" oder "voucher" (case-insensitive)
- Anzahl der Essensmarken (`count`): aus UI-Modal, oder Fallback `Math.floor(amount / rate)` — Satz aus `VoucherRate`-Verzeichnis (Fallback 80)

**SponsorPayment aus Bankimport:**
- Setzt `sponsorId` (Relation) — Schülerdetail und Zahlungsseite zeigen über `p.sponsor`

### Dark Mode

Die Anwendung unterstützt vollständigen Dark Mode, umschaltbar über eine Schaltfläche in der Sidebar (Moon/Sun-Icon).

**Implementierung:**
- Klasse `dark` auf `<html>`-Element — Tailwind `darkMode: 'class'` in `tailwind.config.js`
- CSS-Variablen in `globals.css` für Hintergrund-, Text- und Rahmenfarben (`:root` / `.dark`)
- Zustand in `localStorage` (`theme`) gespeichert + Systempräferenz als Fallback
- Sidebar: `src/components/layout/Sidebar.tsx` — Toggle der `dark`-Klasse auf `document.documentElement`

**Dark-Mode-Konventionen in Komponenten:**
- Karten/Container: `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`
- Haupttext: `text-gray-900 dark:text-gray-100`
- Sekundärtext: `text-gray-700 dark:text-gray-300` oder `text-gray-500 dark:text-gray-400`
- Icons in farbigen Kreisen: `bg-*-50 dark:bg-*-900/30`, `text-*-600 dark:text-*-400`
- Inputs: `border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100`
- Sticky-Header: `bg-[#fafaf8] dark:bg-gray-900` (Seiten), `bg-white dark:bg-gray-800` (thead)
- Tabellenzeilen: `border-gray-50 dark:border-gray-700`

### CSV-Export

Dateien:
- Helper: `src/lib/csv.ts` (Funktion `downloadCSV`)
- UI-Schaltflächen: auf Seiten Schüler, Sponsoren, Zahlungen

**Seiten mit Export:**
| Seite | Datei | Export |
|-------|-------|--------|
| Schüler | `students/page.tsx` | CSV mit allen Schülern (Nummer, Name, Klasse, Geschlecht, Alter, Bedürfnisse, Sponsoren) |
| Sponsoren | `sponsors/page.tsx` | CSV mit Sponsoren (Name, E-Mail, Telefon, Schüleranzahl, Gesamtzahlungen) |
| Zahlungen | `payments/page.tsx` | CSV mit Zahlungen des aktiven Reiters (Sponsor oder Essensmarken) |
| Bescheide | `tuition/page.tsx` | CSV mit Bescheiden (Nummer, Name, Klasse, Betrag, Bezahlt, Verbleibend, Status, Sponsor, Typ, Notizen) |

**Funktion `downloadCSV(headers, rows, filename)`:**
- BOM-Präfix für korrekte Kodierung in Excel (UTF-8)
- Maskierung von Anführungszeichen und Kommas in Werten

### Schulgebührenbescheide (Tuition Charges)

Dateien:
- UI: `src/app/tuition/page.tsx`
- API: `src/app/api/tuition-charges/route.ts`
- Prisma-Modell: `TuitionCharge` (studentId, period, amount, currency, status)
- Sätze: `TuitionRate` (annualFee, gradeFrom, gradeTo, currency)

**Zusammenfassungskarten (3 Blasen):**

| Karte | Hauptwert | Untertext |
|-------|-----------|-----------|
| Gesamt vorgeschrieben | Betrag in CZK | Anzahl Bescheide + jährlich/halbjährlich |
| Gesamt bezahlt | Betrag in CZK (grün) | Anzahl bezahlt / gesamt |
| Gesamt verbleibend | Betrag in CZK (rot) | Anzahl unbezahlt |

- **Jährlich** = period ist nur ein Jahr (`"2026"`), **halbjährlich** = period enthält `-H` (`"2026-H1"`)
- Anzahlen werden als kleiner Text unter dem Hauptbetrag angezeigt

**Generierung von Bescheiden:**
- Panel mit Schülerauswahl (Checkboxen, Klassenfilter, Suche)
- Satz wird automatisch anhand der Schülerklasse und des `TuitionRate`-Verzeichnisses bestimmt
- Duplikate werden übersprungen (Schüler + Periode)

**Tabelle der Bescheide:**

| Spalte | Sortierbar | Beschreibung |
|--------|-----------|--------------|
| Schüler | ja | Name + Nummer (Link zum Detail) |
| Klasse | ja | Klasse des Schülers |
| Betrag | ja | Vorgeschriebener Betrag |
| Bezahlt | ja | Summe der Zahlungen vom Typ Schulgeld für den Schüler im jeweiligen Jahr |
| Verbleibend | ja | Vorgeschrieben − bezahlt |
| Status | ja | UNPAID / PARTIAL / PAID (farbiges Badge) |
| Sponsor | nein | Anklickbare Sponsoren aus Zahlungen |
| Zahlungstyp | nein | Zahlungstypen aus zugehörigen SponsorPayments |
| Notizen | nein | Optionale Notizen |

**Berechnung des bezahlten Betrags:**
- Auf dem Server werden `SponsorPayment` mit Typ, der "školné"/"tuition"/"karo" enthält, summiert
- Gefiltert nach Schüler, Jahr aus der Periode und Währung des Bescheids

### Seitenübergreifende Navigation und anklickbare Links

**Anklickbare Sponsoren in der Schülerliste:**
- Datei: `students/page.tsx`
- In der Sponsorenspalte sind Namen anklickbar → Link zur Sponsorenseite mit Suche (`/sponsors?search=...`)

**Beibehaltung des Suchzustands:**
- Sponsorenseite liest `?search=` aus der URL und füllt das Suchfeld vor
- Bei Rücknavigation aus dem Schülerdetail bleibt der Suchzustand erhalten

**Beibehaltung des aktiven Reiters im Dashboard:**
- Datei: `dashboard/page.tsx`
- Alle Links aus dem Dashboard kodieren den aktiven Reiter im `from=`-Parameter: `from=/dashboard?tab=sponsors`
- Hilfsfunktion `dashFrom()` generiert kodierten `from`-URL mit `tab` (und `paymentSubTab` für Zahlungen)
- Bei der Rückkehr liest das Dashboard `tab` und `paymentSubTab` aus URL-Parametern und stellt den richtigen Reiter wieder her
- Flow: Dashboard (Reiter Sponsoren) → Sponsorendetail → zurück → Dashboard (Reiter Sponsoren)

**Verkettete Rücknavigation (Schülerdetail):**
- Datei: `students/[id]/page.tsx`
- Zurück-Schaltfläche merkt sich den Pfad: Schüler → Sponsoren → Detail → zurück zu Sponsoren → zurück zu Schülern
- Implementiert über `document.referrer` und URL-Parameter

**Sponsorenfilter im Zahlungsformular:**
- Datei: `payments/page.tsx`
- Sponsoren-Dropdown im Zahlungsformular filtert nach ausgewähltem Schüler (zeigt nur dem Schüler zugewiesene Sponsoren)

### Filterung und Suche auf der Zahlungsseite

Datei: `src/app/payments/page.tsx`

- Zwei Reiter: Sponsorenzahlungen / Essensmarken
- **Suche** (Textfeld) — filtert nach Schülername, Sponsor, Notizen
- **Filter Sponsor** — Dropdown mit eindeutigen Sponsoren aus den aktuellen Daten
- **Filter Typ** — Dropdown mit Zahlungstypen (nur bei Sponsorenzahlungen)
- Filter werden kombiniert (AND-Logik)
- Schaltfläche **Abbrechen** in den Formularen (Sponsorenzahlungen und Essensmarken) setzt alle Felder auf Standardwerte zurück
- Auto-Berechnung der Essensmarkenanzahl: Bei Eingabe eines Betrags oder Änderung der Währung wird die Anzahl anhand des Satzes aus dem `VoucherRate`-Verzeichnis neu berechnet

## Benutzerrollen

| Rolle | Rechte |
|-------|--------|
| ADMIN | Vollzugriff, Benutzerverwaltung, Löschen |
| MANAGER | Schüler bearbeiten, Daten hinzufügen, Übersichten |
| SPONSOR | Nur eigene zugewiesene Schüler (nur lesen) |
| VOLUNTEER | Schüler bearbeiten, Daten hinzufügen |

## Datenbanksicherungen und Daten

### Sicherungsdateien

| Datei | Inhalt | Wiederherstellung |
|-------|--------|-------------------|
| `prisma/dev.db.primary` | **VOLLSICHERUNG** — alles inkl. Laufzeitdaten (Bescheide, Zahlungen, Essensmarken…) | `cp prisma/dev.db.primary prisma/dev.db` |
| `prisma/dev.db.backup` | Demo-Daten — 30 Testschüler | `cp prisma/dev.db.backup prisma/dev.db` |
| `prisma/seed-demo.ts` | Demo-Seed-Skript (30 Testschüler) | `cp prisma/seed-demo.ts prisma/seed.ts && npm run db:seed` |

### Quelldaten

| Datei | Inhalt |
|-------|--------|
| `data/students-real.json` | 148 Schüler — vollständige strukturierte Daten (Geburtsdatum, Klasse, Schule, Sponsoren, Gesundheitsstatus, Familiensituation, 30 Geschwistergruppen, erhaltene Gegenstände, Zahnarztuntersuchungen) |
| `data/config-real.json` | Verzeichnisse — Klassen (PP1–Grade 12), Zahlungstypen, Schulgeld, Gesundheitsuntersuchungstypen, monatliche Sponsor-Ordination, Essensmarkensätze |

### Was in der Sicherung (dev.db.primary) vs. im Seed enthalten ist

| Daten | dev.db.primary | seed.ts | Hinweis |
|-------|:-:|:-:|---------|
| Schüler (148) | Ja | Ja | Aus `students-real.json` |
| Sponsoren (137) | Ja | Ja | Aus `students-real.json` |
| Patenschaften (160) | Ja | Ja | Schüler↔Sponsor-Verknüpfungen |
| Ausstattung (224) | Ja | Ja | Equipment aus JSON |
| Gesundheitsuntersuchungen (31) | Ja | Ja | HealthCheck aus JSON |
| Benutzer (admin, manager…) | Ja | Ja | Mit Passwörtern |
| **Verzeichnisse** (Klassen, Typen, Bedürfnisse…) | Ja | Ja | ClassRoom, PaymentType, NeedType… |
| **TuitionRate** (Schulgebührensätze) | Ja | Ja | 2 Sätze (PP1–G6, G7–G12) |
| **VoucherRate** (Essensmarkensätze) | Ja | Ja | 4 Währungen (CZK, EUR, USD, KES) |
| **TuitionCharge** (Bescheide) | **Ja** | **Nein** | Laufzeit — nur in DB-Sicherung |
| **SponsorPayment** (Zahlungen) | **Ja** | **Nein** | Laufzeit — nur in DB-Sicherung |
| **VoucherPurchase** (Essensmarken) | **Ja** | **Nein** | Laufzeit — nur in DB-Sicherung |
| **Need, Wish** (Bedürfnisse/Wünsche der Schüler) | **Ja** | **Nein** | Laufzeit — nur in DB-Sicherung |
| **PaymentImport** (Importe) | **Ja** | **Nein** | Laufzeit — nur in DB-Sicherung |
| **Photo** (Fotos) | **Ja** | **Nein** | Laufzeit — nur in DB-Sicherung |

### Datenwiederherstellung

**Vollsicherung wiederherstellen (empfohlen):**
```bash
cp prisma/dev.db.primary prisma/dev.db
```
Stellt alles wieder her — Schüler, Verzeichnisse, **auch Bescheide, Zahlungen, Essensmarken und weitere Laufzeitdaten**.

**Von Grund auf neu seeden (nur Grunddaten):**
```bash
npx prisma db push && npm run db:seed
```
Erstellt Schüler, Sponsoren, Verzeichnisse, Sätze — aber **nicht** Bescheide, Zahlungen, Essensmarken und weitere Laufzeitdaten.

**Demo-Daten wiederherstellen:**
```bash
cp prisma/dev.db.backup prisma/dev.db
```

**Demo-Daten neu seeden:**
```bash
cp prisma/seed-demo.ts prisma/seed.ts && npm run db:seed
```

### Primärsicherung aktualisieren

Nach der Erstellung wichtiger Laufzeitdaten (Bescheide, Zahlungen…) muss die Sicherung aktualisiert werden:
```bash
cp prisma/dev.db prisma/dev.db.primary
git add prisma/dev.db.primary && git commit -m "Update primary DB backup" && git push origin main
```

**Wie man bei Kontextverlust auf Daten zugreift:**
Sagen Sie: _"Lesen Sie die Dateien `data/students-real.json` und `data/config-real.json`."_

### Anmeldedaten

| Konto | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@rael.school | admin123 |
| Manager | manager@rael.school | manager123 |
| Sponsor | `<vorname.nachname>@sponsor.rael.school` | sponsor123 |
| Freiwilliger | volunteer@rael.school | volunteer123 |

## Saubere Installation und lokale Wiederherstellung von GitHub

Vollständiges Verfahren zum Starten der Anwendung auf einem sauberen lokalen System (oder nach Verlust von `.env` / Datenbank):
```bash
# 1. Letzte Änderungen herunterladen
git pull origin <aktueller-branch>

# 2. Abhängigkeiten installieren
npm install

# 3. .env erstellen (Datei ist in .gitignore, wird nicht übertragen)
echo 'DATABASE_URL="file:./dev.db"' > .env

# 4. Tabellen erstellen + Daten seeden (148 Schüler, 137 Sponsoren, Verzeichnisse)
npx prisma db push && npm run db:seed

# 5. Entwicklungsserver starten
npm run dev
```

**Einzeiliger Befehl (alles auf einmal):**
```bash
npm install && echo 'DATABASE_URL="file:./dev.db"' > .env && npx prisma db push && npm run db:seed && npm run dev
```

**Hinweis:** Die `.env`-Datei muss nur einmal erstellt werden. Bei normalen Aktualisierungen reicht dann:
```bash
git pull origin <aktueller-branch> && npm run dev
```

### Statistiken der Echtdaten

- **148 Schüler** (8 ohne Sponsor)
- **137 einzigartige Sponsoren**
- **160 Sponsorenverknüpfungen**
- **224 Ausstattungsgegenstände**
- **31 Gesundheitsuntersuchungen**
- **30 Geschwistergruppen**
- **14 Klassen** (PP1–Grade 12), insgesamt 467 aktive Schüler
- **Schulgeld:** 3 700 CZK (bis Grade 6), 4 700 CZK (ab Grade 7)
