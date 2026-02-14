# Specifikace: Import a párování plateb z bankovního výpisu

> **Verze:** 1.0
> **Datum:** 2026-02-14
> **Status:** Schváleno k implementaci

---

## 1. Přehled procesu

```
Nahrání souboru (PDF/CSV/XLSX)
  → Vytěžení dat (parser podle formátu)
    → Uložení do DB (PaymentImport + PaymentImportRow)
      → Automatické párování (sponzor, student, typ platby, duplikáty)
        → Ruční revize adminem (oprava, doplnění, split)
          → Hromadné schválení vybraných řádků
            → Zápis do SponsorPayment / VoucherPurchase
```

---

## 2. Podporované formáty

| Formát | Priorita | Poznámka |
|--------|----------|----------|
| **CSV** | **Fáze 1 — nyní** | Strukturovaný soubor s hlavičkou |
| PDF | Fáze 2 | FIO banka, parser na míru |
| XLSX | Fáze 2 | Připravená struktura |

### Formát CSV souboru (Fáze 1)

Soubor musí obsahovat hlavičku s těmito sloupci:

```csv
datum,castka,mena,vs,zprava,odesilatel,ucet_odesilatele
```

- Oddělovač: čárka
- Kódování: UTF-8
- Testovací soubor: `data/test-bank-import.csv` (30 položek)

### Očekávaná pole z výpisu

| Pole | Povinné | Příklad |
|------|---------|---------|
| Datum transakce | Ano | 2026-01-15 |
| Částka | Ano | 3 700.00 |
| Měna | Ano | CZK, EUR, USD, KES |
| Variabilní symbol (VS) | Ne | 12345 |
| Zpráva pro příjemce | Ne | "Školné Wanjiku Kamau" |
| Název odesílatele | Ne | "Jan Novák" |
| Číslo účtu odesílatele | Ne | 2600123456/2010 |

---

## 3. Databázové modely

### 3a. Nový model: PaymentImport

Eviduje jednotlivé importy souborů.

```prisma
model PaymentImport {
  id            String   @id @default(cuid())
  fileName      String               // původní název souboru
  fileType      String               // "pdf", "csv", "xlsx"
  statementDate DateTime?            // datum výpisu (z hlavičky PDF)
  importedById  String               // kdo importoval (User.id)
  totalRows     Int      @default(0)
  matchedRows   Int      @default(0)
  status        String   @default("PROCESSING")
  createdAt     DateTime @default(now())

  importedBy    User     @relation("PaymentImports", fields: [importedById], references: [id])
  rows          PaymentImportRow[]
}
```

**Stavy importu (`PaymentImport.status`):**

| Stav | Význam |
|------|--------|
| `PROCESSING` | Právě se zpracovává |
| `READY` | Zpracováno, čeká na revizi admina |
| `COMPLETED` | Všechny řádky vyřízeny (schváleny/zamítnuty) |
| `CANCELLED` | Import zrušen (pouze pokud žádný řádek nebyl APPROVED) |

### 3b. Nový model: PaymentImportRow

Jeden řádek = jedna transakce z výpisu.

```prisma
model PaymentImportRow {
  id              String   @id @default(cuid())
  importId        String

  // --- Surová data z výpisu ---
  transactionDate DateTime
  amount          Float
  currency        String   @default("CZK")
  variableSymbol  String?
  senderName      String?
  senderAccount   String?
  message         String?
  rawData         String?              // celý originální řádek jako JSON

  // --- Výsledky párování ---
  status          String   @default("NEW")
  sponsorId       String?
  studentId       String?
  paymentTypeId   String?
  matchConfidence String   @default("NONE")
  matchNotes      String?              // popis jak byl match proveden

  // --- Split platba ---
  parentRowId     String?              // pokud child → odkaz na původní řádek

  // --- Duplikát ---
  duplicateOfId   String?              // odkaz na existující SponsorPayment.id

  // --- Schválení ---
  approvedById    String?
  approvedAt      DateTime?
  resultPaymentId String?              // vytvořený SponsorPayment.id / VoucherPurchase.id

  createdAt       DateTime @default(now())

  import       PaymentImport       @relation(fields: [importId], references: [id], onDelete: Cascade)
  sponsor      User?               @relation("ImportRowSponsor", fields: [sponsorId], references: [id])
  student      Student?            @relation(fields: [studentId], references: [id])
  parentRow    PaymentImportRow?   @relation("SplitRows", fields: [parentRowId], references: [id])
  splitRows    PaymentImportRow[]  @relation("SplitRows")
}
```

**Stavy řádku (`PaymentImportRow.status`):**

| Stav | Význam | Barva v UI |
|------|--------|------------|
| `NEW` | Naimportovaný, nepodařilo se nic spárovat | šedá |
| `MATCHED` | Systém navrhl sponzora + studenta + typ | zelená |
| `PARTIAL` | Alespoň 1 pole identifikované, zbytek chybí | žlutá |
| `APPROVED` | Admin schválil → platba zapsána do systému | modrá |
| `REJECTED` | Admin zamítl (neplatná/nerelevantní/duplikát) | červená |
| `DUPLICATE` | Systém detekoval shodu s existující platbou | oranžová |
| `SPLIT` | Původní řádek rozdělen na více child řádků | fialová |

**Míra jistoty párování (`matchConfidence`):**

| Hodnota | Kdy se použije |
|---------|----------------|
| `NONE` | Žádná shoda |
| `LOW` | Shoda jen příjmení, nebo klíčové slovo v poznámce |
| `MEDIUM` | Shoda celého jména odesílatele se sponzorem |
| `HIGH` | Shoda podle VS nebo čísla účtu |

### 3c. Rozšíření modelu User

```prisma
// přidat do stávajícího modelu User:
variableSymbol  String?   // VS přidělený sponzorovi
bankAccount     String?   // číslo účtu sponzora
```

### 3d. Rozšíření modelu SponsorPayment

```prisma
// přidat do stávajícího modelu SponsorPayment:
source          String?   // "manual" | "bankImport" — původ platby
importRowId     String?   // odkaz na PaymentImportRow.id (pro zpětnou vazbu)
```

### 3e. Rozšíření modelu VoucherPurchase

```prisma
// přidat do stávajícího modelu VoucherPurchase:
source          String?   // "manual" | "bankImport"
importRowId     String?   // odkaz na PaymentImportRow.id
```

---

## 4. Algoritmus automatického párování

Spouští se ihned po vytěžení dat ze souboru.

### Krok 1: Detekce duplikátů

Pro každý řádek hledat existující SponsorPayment/VoucherPurchase kde:
- `paymentDate` = `transactionDate` (±1 den)
- `amount` = `amount`
- `currency` = `currency`
- Pokud známe odesílatele → musí souhlasit i sponzor

Pokud nalezeno → `status = DUPLICATE`, `duplicateOfId = id nalezené platby`.

### Krok 2: Identifikace sponzora (podle priority)

1. **VS** → `User.variableSymbol == row.variableSymbol` → confidence `HIGH`
2. **Číslo účtu** → `User.bankAccount == row.senderAccount` → confidence `HIGH`
3. **Jméno odesílatele** → fuzzy match `senderName` vs. `firstName + lastName` sponzorů:
   - Normalizace: odstranit diakritiku, převést na lowercase, odstranit "pan"/"paní"
   - Shoda celého jména (obě části) → confidence `MEDIUM`
   - Shoda pouze příjmení (a příjmení je unikátní) → confidence `LOW`

### Krok 3: Identifikace studenta

- Sponzor nalezen + má **1 aktivního studenta** → přiřadit → confidence odpovídá kroku 2
- Sponzor nalezen + má **více aktivních studentů** → `studentId = null`, admin vybere ručně
- Sponzor nenalezen → hledat jméno studenta ve zprávě pro příjemce (`message`) → confidence `LOW`

### Krok 4: Identifikace typu platby

Hledat klíčová slova ve zprávě pro příjemce (`message`):

| Klíčová slova | Typ platby | Cílový model |
|---------------|------------|--------------|
| školné, tuition, school fee | Školné | SponsorPayment |
| stravenk, voucher, jídlo, food, meal | Stravenky | VoucherPurchase |
| ordinace, klinik, clinic, lékař, doctor, health | Ordinace – měsíční příspěvek | SponsorPayment |
| káva, coffee, café, kafe | Platba za kávu | SponsorPayment |
| tane, dance | Taneční klub – měsíční příspěvek | SponsorPayment |
| seminář, seminar, teen, náctilet | Semináře pro náctileté | SponsorPayment |

Pokud žádné klíčové slovo → `paymentTypeId = null` (neurčeno).

### Krok 5: Výsledný status řádku

| Podmínka | Status |
|----------|--------|
| Duplikát nalezen | `DUPLICATE` |
| Sponzor + student + typ — vše vyplněno | `MATCHED` |
| Alespoň 1 z trojice vyplněno | `PARTIAL` |
| Nic nenalezeno | `NEW` |

---

## 5. Uživatelské rozhraní

### 5a. Přístup

- **ADMIN** a **MANAGER** — plný přístup (import, editace, schvalování)
- Ostatní role — nemají přístup k importu plateb

### 5b. Navigace

- Nová stránka: `/payments/import`
- Odkaz z hlavní stránky plateb (`/payments`) — tlačítko "Import plateb"

### 5c. Stránka: Seznam importů (`/payments/import`)

- Tabulka předchozích importů: datum, soubor, počet řádků, spárováno, status
- Tlačítko "Nahrát nový výpis"
- Klik na import → přechod na detail

### 5d. Nahrání souboru

- Drag & drop zóna nebo tlačítko "Vybrat soubor"
- Akceptované typy: `.pdf`, `.csv`, `.xlsx`
- Po nahrání → zpracování na serveru → přesměrování na detail importu

### 5e. Stránka: Detail importu (`/payments/import/[id]`)

**Statistický panel nahoře:**
```
Celkem: 45 | Spárováno: 30 | Částečně: 8 | Nové: 3 | Duplikáty: 2 | Zamítnuté: 2
```

**Filtry:** Tlačítka pro filtrování podle statusu (vše / spárované / částečné / nové / duplikáty / zamítnuté)

**Tabulka řádků:**

| ☐ | Status | Datum | Odesílatel | Částka | Měna | VS | Zpráva | Sponzor ▼ | Student ▼ | Typ platby ▼ | Akce |
|---|--------|-------|------------|--------|------|----|--------|-----------|-----------|-------------|------|

- ▼ = dropdown (editovatelný přímo v tabulce)
- Sponzor dropdown — s vyhledáváním, po výběru se filtruje seznam studentů
- Student dropdown — filtrovaný podle sponzora (pokud je vybrán), jinak všichni
- Typ platby dropdown — z tabulky PaymentType
- Akce: Rozdělit | Zamítnout

**Hromadné akce (pod tabulkou nebo nahoře):**
- Checkbox "Vybrat vše spárované"
- Tlačítko **"Schválit vybrané"** — zapíše platby do systému
- Tlačítko **"Zamítnout vybrané"** — označí jako zamítnuté

### 5f. Split platby (modal)

Otevře se po kliknutí na "Rozdělit":

- Zobrazí původní částku
- Admin zadá počet částí (2–5)
- Pro každou část:
  - Částka (povinná)
  - Student (dropdown)
  - Typ platby (dropdown)
- **Validace:** součet všech částí = původní částka
- Po potvrzení: původní řádek → status `SPLIT`, vytvoří se child řádky

### 5g. Schválení — co se stane

Při schválení řádku (jednotlivě nebo hromadně):

1. **Pokud typ = Stravenky:**
   - Vytvoří se `VoucherPurchase` (admin musí zadat počet stravenek `count`)
   - `source = "bankImport"`, `importRowId = row.id`

2. **Pokud typ = cokoliv jiného:**
   - Vytvoří se `SponsorPayment`
   - `paymentDate = row.transactionDate`
   - `amount = row.amount`
   - `currency = row.currency`
   - `paymentType = vybraný typ`
   - `sponsorId = row.sponsorId`
   - `studentId = row.studentId`
   - `source = "bankImport"`, `importRowId = row.id`

3. Řádek → `status = APPROVED`, `approvedById`, `approvedAt`, `resultPaymentId`

---

## 6. API endpointy

| Metoda | URL | Účel |
|--------|-----|------|
| `GET` | `/api/payment-imports` | Seznam všech importů |
| `POST` | `/api/payment-imports` | Nahrát soubor → vytěžit → spárovat |
| `GET` | `/api/payment-imports/[id]` | Detail importu + řádky |
| `DELETE` | `/api/payment-imports/[id]` | Zrušit import (pokud žádný APPROVED) |
| `PUT` | `/api/payment-imports/[id]/rows/[rowId]` | Editace řádku (sponzor, student, typ) |
| `POST` | `/api/payment-imports/[id]/approve` | Hromadné schválení (body: `{ rowIds: [...] }`) |
| `POST` | `/api/payment-imports/[id]/reject` | Hromadné zamítnutí (body: `{ rowIds: [...] }`) |
| `POST` | `/api/payment-imports/[id]/rows/[rowId]/split` | Rozdělit řádek (body: `{ parts: [...] }`) |

---

## 7. Zpracování souborů

### Fáze 1: CSV parser
- Standardní CSV s hlavičkou (viz sekce 2)
- Knihovna: vestavěný parser nebo `papaparse`
- Validace: povinné sloupce `datum`, `castka`, `mena`

### Fáze 2: PDF parser (FIO banka)
- Knihovna: **pdf-parse** (npm)
- Extrakce textu z PDF → parsování tabulkové struktury
- FIO výpis má specifický formát — parser na míru
- Vzorový PDF: `data/fio-vypisek-vzor.pdf`

---

## 8. Překlady (i18n)

Nové klíče ve všech třech jazycích (cs/en/sw) pod sekcí `"paymentImport"`:

| Klíč | CS | EN | SW |
|------|----|----|----|
| title | Import plateb | Payment Import | Uagizaji wa Malipo |
| upload | Nahrát výpis | Upload Statement | Pakia Taarifa |
| uploadHint | Přetáhněte soubor nebo klikněte | Drag & drop or click to select | Buruta faili au bofya kuchagua |
| processing | Zpracovávám... | Processing... | Inachakata... |
| importDate | Datum importu | Import Date | Tarehe ya Uagizaji |
| statementDate | Datum výpisu | Statement Date | Tarehe ya Taarifa |
| fileName | Název souboru | File Name | Jina la Faili |
| totalRows | Celkem řádků | Total Rows | Jumla ya Safu |
| matchedRows | Spárováno | Matched | Zinazolingana |
| statusNew | Nová | New | Mpya |
| statusMatched | Spárovaná | Matched | Imelingana |
| statusPartial | Částečně | Partial | Sehemu |
| statusApproved | Schválená | Approved | Imeidhinishwa |
| statusRejected | Zamítnuta | Rejected | Imekataliwa |
| statusDuplicate | Duplikát | Duplicate | Nakala |
| statusSplit | Rozdělená | Split | Imegawanywa |
| sender | Odesílatel | Sender | Mtumaji |
| variableSymbol | VS | Variable Symbol | Ishara ya Kutofautiana |
| message | Zpráva | Message | Ujumbe |
| confidence | Jistota shody | Match Confidence | Uhakika wa Mechi |
| approveSelected | Schválit vybrané | Approve Selected | Idhinisha Zilizochaguliwa |
| rejectSelected | Zamítnout vybrané | Reject Selected | Kataa Zilizochaguliwa |
| split | Rozdělit | Split | Gawanya |
| splitPayment | Rozdělit platbu | Split Payment | Gawanya Malipo |
| splitParts | Počet částí | Number of Parts | Idadi ya Sehemu |
| splitSum | Součet musí odpovídat původní částce | Sum must equal original amount | Jumla lazima ilingane na kiasi cha awali |
| selectAllMatched | Vybrat vše spárované | Select All Matched | Chagua Zote Zinazolingana |
| undetermined | Neurčeno | Undetermined | Haijaamuliwa |
| duplicateOf | Duplikát platby | Duplicate of Payment | Nakala ya Malipo |
| importHistory | Historie importů | Import History | Historia ya Uagizaji |
| noImports | Žádné importy | No Imports | Hakuna Uagizaji |
| cancelImport | Zrušit import | Cancel Import | Futa Uagizaji |
| alreadyApproved | Nelze zrušit — obsahuje schválené platby | Cannot cancel — contains approved payments | Haiwezi kufutwa — ina malipo yaliyoidhinishwa |
| voucherCount | Počet stravenek | Voucher Count | Idadi ya Vocha |
| source | Zdroj | Source | Chanzo |
| bankImport | Import z banky | Bank Import | Uagizaji wa Benki |
| manual | Ruční zadání | Manual Entry | Kuingiza kwa Mkono |

---

## 9. Bezpečnost

- Upload: validace MIME type + přípony souboru
- Maximální velikost souboru: 10 MB
- Přístup: pouze ADMIN a MANAGER (kontrola role na API i UI úrovni)
- Sanitizace dat z PDF (prevence injection)
- Import nelze smazat pokud obsahuje APPROVED řádky

---

## 10. Fáze implementace

### Fáze 1 (nyní) — rozděleno do etap

**Etapa 1 — Databáze**
- Prisma schema — nové modely (PaymentImport, PaymentImportRow)
- Rozšíření stávajících modelů (User, SponsorPayment, VoucherPurchase)
- Migrace + seed testovacích dat

**Etapa 2 — CSV parser + API upload**
- CSV parser (čtení, validace, uložení do DB)
- POST /api/payment-imports (upload + parse)
- GET /api/payment-imports (seznam)
- GET /api/payment-imports/[id] (detail)
- DELETE /api/payment-imports/[id] (zrušení)

**Etapa 3 — Automatické párování**
- Detekce duplikátů
- Identifikace sponzora (VS → účet → jméno)
- Identifikace studenta
- Identifikace typu platby (klíčová slova)
- Přiřazení statusu a confidence

**Etapa 4 — UI: Seznam importů + Upload**
- Stránka /payments/import
- Upload drag & drop zóna
- Tabulka historie importů
- Odkaz z /payments

**Etapa 5 — UI: Detail importu + Revize**
- Stránka /payments/import/[id]
- Statistický panel
- Filtrovaná tabulka s barevnými statusy
- Inline dropdowny (sponzor, student, typ platby)

**Etapa 6 — UI: Akce (Schválení / Zamítnutí / Split)**
- PUT /api/.../rows/[rowId] (editace řádku)
- POST .../approve + .../reject (hromadně)
- POST .../rows/[rowId]/split
- Split modal
- Zápis do SponsorPayment / VoucherPurchase
- Překlady (cs/en/sw) průběžně u každé etapy

### Fáze 2 (později)
- PDF parser pro FIO banku
- XLSX parser
- Automatické přidělování VS sponzorům
- Export přehledu importů

### Fáze 3 (budoucnost)
- API napojení na banku (automatické stahování výpisů)
- Notifikace sponzorům o přijaté platbě
- Pravidelný scheduled import

---

## 11. Závislosti (npm)

| Balíček | Účel | Fáze |
|---------|------|------|
| `papaparse` | CSV parser | Fáze 1 |
| `pdf-parse` | Extrakce textu z PDF | Fáze 2 |

---

## 12. Testovací data

- Testovací CSV: `data/test-bank-import.csv` — 30 položek pokrývajících všechny typy plateb
- Vzorový FIO PDF: `data/fio-vypisek-vzor.pdf` — reálný výpis leden 2026
