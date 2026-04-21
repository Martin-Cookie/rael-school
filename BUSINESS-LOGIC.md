# Rael School – Business Logic – 2026-04-21

> Automaticky extrahováno z kódu Business Logic Agentem. Dokumentuje veškerou business logiku aplikace — procesy, pravidla, datový model, edge cases a integrace. Slouží jako technický referenční dokument pro vývojáře a pro případný přepis/migraci.

## Obsah

1. Business procesy
2. Business pravidla
3. Datový model
4. Edge cases a workaroundy
5. Integrace
6. Appendix: Konstanty a konfigurace

---

## 1. Business procesy

### 1.1 Přihlášení uživatele (Login)

**Účel:** Autentizace uživatele a vystavení JWT session.

**Kroky:**
1. Klient pošle `{ email, password }` na `POST /api/auth/login`.
2. Server zkontroluje rate limit (max 5 pokusů / 15 minut / IP — klíč `login:<ip>`, `checkRateLimit` default).
3. Najde uživatele podle `email` a ověří `isActive`.
4. Porovná heslo přes `bcrypt.compare` (10 rounds).
5. Vystaví JWT token (24h, secret z `process.env.JWT_SECRET` nebo auto-generovaný 32B hash).
6. Uloží token do `httpOnly` cookie `auth-token` (secure, sameSite: strict, maxAge 24h).
7. Zapíše do `AuditLog` (LOGIN nebo LOGIN_FAILED).

**Kde v kódu:** `src/app/api/auth/login/route.ts`, `src/lib/auth.ts`

**Role a autorizace:** všechny role (ADMIN, MANAGER, SPONSOR, VOLUNTEER).

---

### 1.2 Přidání studenta

**Účel:** Vytvoření nového studenta s unikátním student number.

**Vstupní podmínky:** Uživatel má roli s právem editace (ADMIN/MANAGER/VOLUNTEER — `canEdit`).

**Kroky:**
1. `POST /api/students` s payloadem (`firstName`, `lastName`, `dateOfBirth?`, `className?`, rodinná data).
2. Validace přes `studentSchema` (Zod, `src/lib/validations.ts`) — max délky, trim.
3. Rate limit `students:create:<userId>` — 20 / minutu.
4. Server načte posledního studenta (podle `studentNo desc`), extrahuje číselnou část, inkrementuje.
5. Vygeneruje `studentNo = "RAEL-" + String(n+1).padStart(3, '0')` (např. `RAEL-149`).
6. Vytvoří `Student` a zapíše `AuditLog` (CREATE).

**Kde v kódu:** `src/app/api/students/route.ts:POST` ř. 84–136.

**Role a autorizace:** ADMIN / MANAGER / VOLUNTEER.

---

### 1.3 Sponzorská platba (SponsorPayment)

**Účel:** Registrace platby od sponzora pro studenta s daným typem (školné, ordinace atd.).

**Kroky:**
1. `POST /api/payments` s `{ type: 'sponsor', studentId, sponsorId?, paymentDate, amount, currency, paymentType, notes? }`.
2. Rate limit `payments:write:<userId>` — 30 / minutu.
3. Validace: povinná pole + `amount > 0` (float).
4. Výchozí currency = `'KES'`.
5. Vytvoří `SponsorPayment`.
6. **Pokud `paymentType` je školné** (`isTuitionType` → regex `/školné|tuition|karo/i`): zavolá `recalcTuitionStatus(studentId)`.

**PUT/DELETE** — přepočet se volá pro STARÉHO i NOVÉHO studenta (pokud se změnil), aby se oba předpisy aktualizovaly.

**Kde v kódu:** `src/app/api/payments/route.ts:POST/PUT/DELETE`, `src/lib/tuition.ts:recalcTuitionStatus`.

---

### 1.4 Nákup stravenek (VoucherPurchase)

**Účel:** Evidence nákupu stravenek (poukazů na jídlo). Stravenky jsou vždy v KES (běžně ale uživatel zadává v CZK/EUR/USD a počet se přepočítá).

**Kroky:**
1. `POST /api/payments` s `{ type: 'voucher', studentId, purchaseDate, amount, currency, count, donorName?, sponsorId?, notes? }`.
2. Validace: povinná pole, `amount > 0`, `count > 0` (int).
3. UI (detail studenta + platby) auto-přepočítá `count` z `amount / VoucherRate.rate` dle měny.
4. Server uloží `count` jak ho obdrží (nedělá přepočet — ten je na klientovi nebo při bank importu).

**Kde v kódu:** `src/app/api/payments/route.ts:POST` ř. 135–161.

---

### 1.5 Import bankovního výpisu (upload → matching → approve/split/reject)

**Účel:** Automatické zpracování bankovních výpisů a vytvoření plateb.

#### Stavový automat `PaymentImportRow.status`

```
NEW ── runMatching ──► MATCHED (sponsor + student + type) ─┐
                      └► PARTIAL (aspoň jedno)               │ approve
                      └► DUPLICATE (shoda na SponsorPayment) │ ──► APPROVED ──► (vytvoří SP/VP)
                      └► NEW (nic nenalezeno)                │
                                                              │ reject
                                                              └──► REJECTED
                      └──► SPLIT (po rozdělení) → child rows NEW/PARTIAL/MATCHED/APPROVED
```

#### 1.5.1 Upload & matching

**Kroky:**
1. `POST /api/payment-imports` (multipart): validace — max 10 MB, přípona `.csv`.
2. JWT user → DB lookup podle emailu (ochrana proti stale ID po re-seedu).
3. `parseCSV(text)` — `src/lib/csvParser.ts` (Papa Parse):
   - Povinné sloupce: `datum`, `castka`, `mena` (lower-case header).
   - Volitelné: `vs`, `odesilatel`, `ucet_odesilatele`, `zprava`.
   - Datum: podporuje `YYYY-MM-DD`, `DD.MM.YYYY`, `DD/MM/YYYY`.
   - Amount: odstraní mezery, čárku → tečka, `parseFloat`.
4. Transakce: vytvoří `PaymentImport` (status `READY`) + všechny rows (status `NEW`).
5. `runMatching(prisma, importId)` — `src/lib/paymentMatcher.ts`:
   - Batch-load sponzoři (jen `SPONSOR`, `isActive`), studenti, paymentTypes.
   - Pre-load existující `SponsorPayment` a `VoucherPurchase` v rozsahu dat ± 1 den.
   - Pro každý řádek: detekce duplicitu → sponzora (VS, bankAccount, fuzzy name) → studenta (single sponsorship, jméno v message) → paymentType (klíčová slova).

**Confidence:** `HIGH` (VS/bankAccount/full name) | `MEDIUM` (celé jméno) | `LOW` (jen příjmení nebo jméno z message) | `NONE`.

#### 1.5.2 Approve

**Kroky:**
1. `POST /api/payment-imports/[id]/approve` s `{ rowIds }`.
2. Role MANAGER+. Rate limit 10 / minutu.
3. Validace: všechny rows musí mít `studentId` + `paymentTypeId` (jinak 400 s `incompleteRowIds`).
4. Transakce: pro každou row
   - **Voucher type** (`isVoucherPaymentType`): vytvoří `VoucherPurchase`
     - `count = row.voucherCount ?? Math.floor(amount / rate)` (rate z `VoucherRate` nebo fallback 80)
     - `donorName` = `firstName + lastName` sponzora (pokud existuje)
     - `source = 'bankImport'`, `importRowId = row.id`
   - **Jinak:** vytvoří `SponsorPayment` (`paymentType = pt.name`)
   - Row dostane `status: APPROVED`, `approvedById`, `approvedAt`, `resultPaymentId`.
5. Pokud žádné další rows nejsou `NEW/MATCHED/PARTIAL` → `PaymentImport.status = 'COMPLETED'`.
6. Pro všechny studenty s školnými platbami: `recalcTuitionStatus`.
7. Audit log `APPROVE`.

**Kde v kódu:** `src/app/api/payment-imports/[id]/approve/route.ts`.

#### 1.5.3 Split

**Kroky:**
1. `POST /api/payment-imports/[id]/rows/[rowId]/split` s `{ parts: [{ amount, studentId?, paymentTypeId?, count? }] }`.
2. Pravidla: 2–5 parts, součet částek = `row.amount` (tolerance `AMOUNT_TOLERANCE = 0.01`), všechny `amount > 0`.
3. Row nesmí být `APPROVED/REJECTED/SPLIT`.
4. Transakce: původní row → `SPLIT`. Pro každou part vytvoří child row:
   - Status se odvodí: `hasStudent && hasType` → `APPROVED` (auto-approve + vytvoří SP/VP), jinak `PARTIAL` nebo `NEW`.
   - Child row dědí `sponsorId`, `senderName`, `senderAccount`, `variableSymbol`, `message`, `currency`, `transactionDate`; `matchConfidence = 'HIGH'`, `parentRowId`.
   - Voucher count: `part.count` nebo `Math.floor(part.amount / rate)`.
5. Inkrementuje `PaymentImport.totalRows`.
6. Když je vše resolved → `COMPLETED`.
7. Tuition recalc. Audit log `SPLIT`.

**Kde v kódu:** `src/app/api/payment-imports/[id]/rows/[rowId]/split/route.ts`.

#### 1.5.4 Reject

**Kroky:**
1. `POST /api/payment-imports/[id]/reject` s `{ rowIds }`.
2. `updateMany` — jen rows ve stavu ne-APPROVED/ne-REJECTED dostanou `status: 'REJECTED'`, `approvedById`, `approvedAt`.
3. Check COMPLETED. Audit log `REJECT`.

---

### 1.6 Generování předpisů školného (Tuition Charges)

**Účel:** Hromadné vytvoření `TuitionCharge` pro období (`"2026"` celoroční, `"2026-H1"` pololetní).

**Kroky:**
1. `POST /api/tuition-charges` s `{ period, studentIds? }`. Role MANAGER+. Rate limit 20 / min.
2. Validace: `period` trim/required. Načti aktivní `TuitionRate` (jinak 400 "No rates").
3. Načti aktivní studenty (volitelně jen vybrané) a `ClassRoom` pro mapování `sortOrder`.
4. Skip existující předpisy (`period` shoda) — deduplikace.
5. Pro každého studenta:
   - `sortOrder = classNameToSortOrder[student.className]` (Map)
   - `rate = rates.find(r => sortOrder >= r.gradeFrom && sortOrder <= r.gradeTo)`
   - Pokud rate nenalezena nebo `sortOrder` undefined → `skipped++`
   - Jinak vytvoří `TuitionCharge` s `amount = rate.annualFee`, `currency = rate.currency`, `status = 'UNPAID'`.
6. Vrátí `{ created, skipped, total }`.

**Kde v kódu:** `src/app/api/tuition-charges/route.ts:POST` ř. 119–194.

---

### 1.7 Návštěvní karty (Visit Cards) — tisk

**Účel:** Generování 2-stránkového A4 formuláře pro sponzora (osobní údaje, rodina, vybavení, potřeby, přání, zdraví, poznámky).

**Kroky:**
1. `GET /api/reports/visit-cards` → vrátí aktivní studenty s `equipment`, `needs` (neukončené), `wishes` (neukončené), `sponsorships` (aktivní). Také číselníky `needTypes`, `wishTypes`, `equipmentTypes` s cenami.
2. UI (`src/app/reports/visit-cards/print/page.tsx`): React vygeneruje HTML snapshot → vloží do iframe → `print()`.
3. Layout: 2 stránky (výška `calc(297mm - 16mm)`), flex-fill pro poznámky.

**Role:** canEdit (ADMIN/MANAGER/VOLUNTEER).

---

### 1.8 Upload fotografie studenta

**Kroky:**
1. `POST /api/students/[id]/photos` (multipart): `file`, `category`, `description`, `takenAt`.
2. Validace: `image/jpeg|png|webp|gif`, max 10 MB.
3. Vytvoří adresář `public/uploads/<studentId>/`, filename `${Date.now()}-${random}.<ext>`.
4. **Magic bytes validace** (`isValidImageMagicBytes`): JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, GIF `47 49 46 38`, WebP `RIFF....WEBP`. Pokud FAIL → 400.
5. Zapíše file na disk + `Photo` row.

**DELETE:** načte `Photo`, smaže file (`unlink`, ignoruje chyby), smaže DB row.

**Kde v kódu:** `src/app/api/students/[id]/photos/route.ts`.

---

### 1.9 Záloha a obnova databáze

**Export:** `GET /api/admin/backup/database` — přečte `prisma/dev.db`, vrátí jako download. Role ADMIN. Rate limit 5 / hodinu.

**Restore:** `POST /api/admin/backup/restore` (multipart SQLite soubor, max 50 MB).
1. Validace magic header: `buffer.slice(0,16).toString('ascii')` musí začínat `"SQLite format 3"` + velikost ≥ 1024 B.
2. Zápis do `dev.db.temp-restore`.
3. `sqlite3 ".tables"` → musí obsahovat `Student`, `User`, `Equipment`, `Need` (pokud `sqlite3` není dostupné, skip).
4. Safety backup current DB → `dev.db.before-restore`.
5. `copyFile(tempPath, dbPath)`. Smaž temp.
6. `sqlite3 PRAGMA integrity_check` → pokud není `ok`, revert z `dev.db.before-restore`.

**Kde v kódu:** `src/app/api/admin/backup/database/route.ts`, `src/app/api/admin/backup/restore/route.ts`.

---

## 2. Business pravidla

### 2.1 Voucher count výpočet

**Pravidlo:** `count = Math.floor(amount / VoucherRate.rate)` — fallback `80` pokud pro měnu neexistuje sazba. Minimální `count = 1` (viz `voucherCount || 1` v approve/split).

**Důvod:** Cena 1 stravenky se liší podle měny; server nechce selhat když admin neupraví sazbu.

**Kde v kódu:**
- Klient: `src/app/students/[id]/page.tsx` (záložka Stravenky), `src/app/payments/page.tsx`, `src/app/payments/import/[id]/page.tsx` (split modal).
- Server: `src/app/api/payment-imports/[id]/approve/route.ts:86`, `.../split/route.ts:143`.
- Fallback konstanta: `DEFAULT_VOUCHER_RATE_FALLBACK = 80` v `src/lib/constants.ts`.

**Sazby v seedu:** CZK 80, EUR 3, USD 3.5, KES 80.

---

### 2.2 Tuition status (UNPAID / PARTIAL / PAID)

**Pravidlo:**
- `paidAmount ≤ 0` → `UNPAID`
- `0 < paidAmount < charge.amount` → `PARTIAL`
- `paidAmount ≥ charge.amount` → `PAID`

**Výpočet `paidAmount`:** suma `SponsorPayment.amount` pro studenta, **stejnou měnu**, typ platby je školné, datum v rámci roku z `charge.period.split('-')[0]` (`YYYY-01-01` ≤ date < `YYYY+1-01-01`).

**Kde v kódu:** `src/lib/tuition.ts:recalcTuitionStatus` ř. 8–56.

**Volání:** po create/update/delete `SponsorPayment` typu školné (incl. bank import approve/split). Pro update přepočet probíhá pro **starého I nového** studenta.

---

### 2.3 Detekce stravenky / školného (paymentType)

**Stravenka:** `pt.name.toLowerCase().includes('stravenk') || .includes('voucher')` (`isVoucherPaymentType` v `src/lib/paymentTypes.ts`).

**Školné:** regex `/školné|tuition|karo/` proti `(name + nameEn + nameSw).toLowerCase()` (`isTuitionPaymentType`). `"karo"` je svahilský výraz pro "tuition".

**Důvod:** Typy plateb jsou editovatelný číselník — logika nemůže spoléhat na ID nebo pevné jméno.

---

### 2.4 Měna a formátování

- `CURRENCIES = ['CZK', 'EUR', 'USD', 'KES']` (`src/lib/constants.ts`).
- Defaulty: `SponsorPayment.currency = 'KES'` (v DB i v POST), `VoucherPurchase.currency = 'CZK'`, `TuitionCharge.currency = 'CZK'`.
- Formát tisíců: mezera (`1 000`). `formatNumber(num)` používá `toLocaleString('cs-CZ')`.
- Formát datum: `DD.MM.YYYY` (cs), `en-GB` nebo `sw-KE`.
- Měna za číslem: `fmtCurrency(1500, 'KES')` → `"1 500 KES"`.

**Kde v kódu:** `src/lib/format.ts`, `src/lib/constants.ts`.

---

### 2.5 Řazení tříd

**Pravidlo:** `ClassRoom.sortOrder` (int) — ručně nastavené pořadí v seedu: PP1=0, PP2=1, Grade 1=2, …, Grade 12=13. Přirozené řazení stránek se opírá o tuto hodnotu.

**TuitionRate** používá `gradeFrom`/`gradeTo` vůči `sortOrder`:
- `PP1–Grade 6`: `0..7` → **3 700 CZK** ročně
- `Grade 7–Grade 12`: `8..13` → **4 700 CZK** ročně

**Kde:** `prisma/seed.ts:208`, `src/app/api/tuition-charges/route.ts:88,170`.

---

### 2.6 Uniqueness & deduplikace

- `User.email` unique. `Student.studentNo` unique. Číselníky (`ClassRoom.name`, `PaymentType.name`, …) unique.
- **Sponsor email** generováno jako `<firstname>.<lastname>@sponsor.rael.school` (lowercase, bez diakritiky, bez special chars).
- **TuitionCharge deduplikace:** při generování se skipuje pokud `(studentId, period)` už existuje. Nezabráněno unique constraintem v DB (může vzniknout ručním vytvořením).
- **Sponsorship deduplikace:** není vynucena DB — lze vytvořit dvakrát (záměr: historie podpor).

---

### 2.7 Role a autorizace

| Role | Vidí studenty | Vytváří/edituje | Maže | Admin sekce |
|------|---------------|------|------|-------------|
| ADMIN | všechny | ano | ano | plný přístup |
| MANAGER | všechny | ano (studenti, platby, tuition) | platby | ne |
| VOLUNTEER | jen assigned (VolunteerAssignment) | ano | ne | ne |
| SPONSOR | jen své (Sponsorship) | ne (read-only) | ne | ne |

Helpery v `src/lib/auth.ts`: `isAdmin`, `isManager`, `canEdit` (ADMIN/MANAGER/VOLUNTEER), `isSponsor`.

Filtrování studentů: `src/app/api/students/route.ts:19–37` — sponzor/dobrovolník vidí jen svou podmnožinu.

---

### 2.8 Rate limiting

In-memory Map s cleanup každých 5 minut (`src/lib/rateLimit.ts`). Klíč: `<operace>:<userId|ip>`. Vybrané limity:

| Operace | Limit | Okno |
|---------|-------|------|
| `login:<ip>` | 5 | 15 min |
| `payments:write:<user>` | 30 | 1 min |
| `students:create:<user>` | 20 | 1 min |
| `import:approve:<user>` | 10 | 1 min |
| `import-ops:<user>` (split/reject) | 10 | 1 min |
| `tuition-charges:<user>` | 20 | 1 min |
| `student-photos:<user>` | 10 | 1 min |
| `translate:<user>` | 20 | 1 min |
| `codelist-write:<user>` | 30 | 1 min |
| `db-export:<user>` | 5 | 1 hod |
| `restore:<user>` | 3 | 1 hod |

Chyba 429 s `Retry-After` headerem.

---

### 2.9 CSRF ochrana

Všechny mutující requesty (POST/PUT/DELETE/PATCH) volané z klienta musí obsahovat header `x-csrf-token` shodný s cookie `csrf-token` (32B hex). Klient používá `fetchWithCsrf()` wrapper.

**Kde v kódu:** `src/lib/csrf.ts`, `src/lib/fetchWithCsrf.ts`.

---

## 3. Datový model

### 3.1 User

**Business účel:** Autentizovaný účet v systému. Role určuje, co vidí a dělá.

**Role:** `ADMIN`, `MANAGER`, `SPONSOR`, `VOLUNTEER` (default).

**Klíčová pole:** `email` (unique), `password` (bcrypt), `isActive`, `variableSymbol` (pro matching bank importu), `bankAccount`.

**Relace:** `sponsorships` (M:N → Student přes Sponsorship), `sponsorPayments`, `voucherPurchases`, `paymentImports`.

---

### 3.2 Student

**Účel:** Podporovaný žák keňské školy.

**Klíčová pole:** `studentNo` (unique, formát `"RAEL-XXX"`), `className` (**volné textové pole**, ne FK — dropdown z `ClassRoom.name`), `school` (výchozí `"Rael"`), `orphanStatus` (`"total"`, `"partial"`, `null`), rodinná info (`motherName/fatherName/Alive`, `siblings` jako string).

**Životní cyklus:** `isActive = true` (default) → potenciálně `false` (ukončeno studium). Ve filtrech se téměř vždy filtruje na `isActive: true`.

**Onus delete:** Cascade na všechny vazby (Equipment, Need, Photo, Voucher, Sponsorship, atd.).

---

### 3.3 Sponsorship

**Účel:** Historický záznam, že sponzor v období `[startDate, endDate]` podporuje/podporoval studenta.

**Pole:** `studentId`, `userId` (sponsor), `startDate` (default now), `endDate?`, `notes`, `isActive`.

**Není unique** — lze vytvořit opakovaně pro historii.

---

### 3.4 SponsorPayment

**Účel:** Finanční platba od sponzora pro studenta.

**Pole:** `studentId` (required), `sponsorId?` (nullable → anonymní dárce), `paymentDate`, `amount`, `currency` (default `"KES"`), `paymentType` (string, ne FK!), `notes`, `source` (`"manual"` / `"bankImport"`), `importRowId?`.

**Cascade:** při smazání studenta padají platby; při smazání sponzora → `SetNull` (platba zůstane jako anonymní).

---

### 3.5 VoucherPurchase

**Účel:** Nákup stravenek pro studenta.

**Pole:** `studentId`, `purchaseDate`, `amount`, `currency` (default `"CZK"`), `count`, `donorName?` (legacy textové pole — drží jméno když neexistuje User), `sponsorId?`, `source`, `importRowId?`.

**Poznámka:** Z bank importu se vyplňují OBA: `sponsorId` (FK) i `donorName` (text). Detail studenta zobrazuje `v.donorName`, stránka plateb `v.sponsor` s fallbackem.

---

### 3.6 TuitionCharge

**Účel:** Předpis školného pro studenta na období.

**Pole:** `studentId`, `period` (string `"2026"` nebo `"2026-H1"`), `amount`, `currency`, `status` (`UNPAID`/`PARTIAL`/`PAID`, default `UNPAID`).

**Status** je computed — recalc-uje `recalcTuitionStatus` po každé změně `SponsorPayment` typu školné.

**Životní cyklus:** `UNPAID` → `PARTIAL` → `PAID`. Může jít i zpátky když se platba smaže.

---

### 3.7 PaymentImport + PaymentImportRow

**PaymentImport:** Hlavička uploadu. `fileName`, `fileType`, `statementDate`, `importedById`, `totalRows`, `matchedRows`, `status` (`PROCESSING`/`READY`/`COMPLETED`/`CANCELLED`).

**PaymentImportRow:** Řádky výpisu. Surová data + match výsledky. Klíčová pole:
- `status`: `NEW` | `MATCHED` | `PARTIAL` | `APPROVED` | `REJECTED` | `DUPLICATE` | `SPLIT`
- `matchConfidence`: `NONE` | `LOW` | `MEDIUM` | `HIGH`
- `voucherCount?` — manuálně zadaný počet (nebo z split modalu)
- `parentRowId?` — self-reference pro split (child rows mají parent)
- `duplicateOfId?` — odkaz na existující `SponsorPayment.id`
- `resultPaymentId?` — ID vytvořené SP/VP po approve
- `approvedById?`, `approvedAt?`

---

### 3.8 Need / Wish / Equipment + typy

**Need:** `description`, `isFulfilled`, `fulfilledAt?`. Běžně se v dashboardu počítají **nefulfilled**.
**Wish:** `description`, `wishTypeId?` (FK na `WishType` s cenou), `isFulfilled`.
**Equipment:** `type` (string z `EquipmentType`), `condition`, `acquiredAt?`, `notes`.

**Typy v číselnících** (`NeedType`, `WishType`, `EquipmentType`) mají `price?` (orientační v CZK), `nameEn`, `nameSw`, `sortOrder`, `isActive`.

---

### 3.9 AuditLog

**Pole:** `userId?`, `userEmail?`, `action` (CREATE/UPDATE/DELETE/LOGIN/LOGIN_FAILED/EXPORT/RESTORE/APPROVE/REJECT/SPLIT), `resource`, `resourceId?`, `detail?`, `ip?`.

**Zápis přes `logAudit` — nikdy nevyhodí výjimku** (error se jen console.log-uje).

---

### 3.10 Číselníky

| Model | Price | Poznámka |
|-------|-------|----------|
| ClassRoom | — | `sortOrder` pro přirozené řazení tříd |
| PaymentType | — | Používá jméno, detekce přes regex |
| NeedType | Ano | Cena v CZK |
| WishType | Ano | Cena v CZK |
| EquipmentType | Ano | Cena v CZK |
| HealthCheckType | — | |
| TuitionRate | Ano (`annualFee`) | `gradeFrom/gradeTo` vůči `ClassRoom.sortOrder` |
| VoucherRate | Ano (`rate`) | `currency` unique |

Soft-delete: nastavení `isActive = false` (ve `codelistRoute.ts` generic DELETE handler).

---

## 4. Edge cases a workaroundy

### 4.1 Chybějící VoucherRate → fallback 80

**Problém:** Admin může smazat `VoucherRate` pro měnu, ale platby mohou chodit v té měně.

**Řešení:** `DEFAULT_VOUCHER_RATE_FALLBACK = 80` v `src/lib/constants.ts` (použito v approve/split endpointech a UI).

**Kde v kódu:** `src/app/api/payment-imports/[id]/approve/route.ts:85`, `.../split/route.ts:142`.

**Riziko:** Pokud reálná cena stravenky v dané měně není 80, počet se zapíše špatně. Admin by měl vždy mít sazby pro všechny používané měny.

---

### 4.2 Přirozené řazení tříd přes sortOrder

**Problém:** Alfabetické řazení dává `Grade 1, Grade 10, Grade 11, …, Grade 2, …` špatně.

**Řešení:** Ruční `sortOrder` v `ClassRoom` (seed: PP1=0, PP2=1, Grade 1=2, … Grade 12=13).

**Navazuje:** `TuitionRate.gradeFrom/gradeTo` — int vůči `sortOrder`, ne proti konkrétní grade číslu.

---

### 4.3 CSV BOM prefix

**Problém:** Excel při otevření CSV bez BOM zobrazí diakritiku špatně (Windows-1250 vs UTF-8).

**Řešení:** `'﻿'` prefix před CSV obsahem (`src/lib/csv.ts:21`).

---

### 4.4 Magic bytes validace obrázků

**Problém:** Klient může poslat `Content-Type: image/jpeg` s obsahem jiného typu (XSS/RCE).

**Řešení:** Check prvních 3–12 bytů (JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, GIF `47 49 46 38`, WebP `RIFF....WEBP`).

**Kde v kódu:** `src/app/api/students/[id]/photos/route.ts:75–93`.

---

### 4.5 JWT user ID vs DB ID po re-seedu

**Problém:** Po `npm run db:seed` jsou ID uživatelů nová, ale JWT v cookie má stará.

**Řešení:** V `approve`, `reject`, `split`, `POST /payment-imports` endpointech se po `getCurrentUser()` volá znovu `prisma.user.findUnique({ where: { email: jwtUser.email } })`. Použije se `dbUser.id`, ne JWT `id`.

---

### 4.6 MyMemory returns source on no-translation

**Problém:** MyMemory API vrátí originální text jako "překlad" když překlad neexistuje.

**Řešení:** `if (translated.toLowerCase() === text.toLowerCase()) return null` (`src/app/api/admin/translate/route.ts:16`).

---

### 4.7 Sticky table layout — žádné overflow

**Problém:** `overflow-hidden`/`overflow-x-auto` vytvoří scroll context a zruší `position: sticky` pro thead.

**Řešení:** Tabulky NESMÍ být obaleny `overflow-*`. Thead musí mít neprůhledné pozadí (`bg-white`, ne `bg-gray-50/50`).

**Kde:** `CLAUDE.md` + hook `useStickyTop` (`src/hooks/useStickyTop.ts`) měří výšku sticky hlavičky a dynamicky nastavuje `theadTop`.

---

### 4.8 Tuition recalc přes starého i nového studenta

**Problém:** Při PUT `SponsorPayment` se může změnit `studentId` — musíš přepočítat předpisy pro oba.

**Řešení:** `Set<string>` `affectedStudents` v `src/app/api/payments/route.ts:214–218` — přidá starého (pokud byl tuition), nového (pokud je tuition) a iteruje.

---

### 4.9 Non-active sponsors/students filtering

Když admin soft-deletuje sponzora nebo studenta (`isActive = false`), cizí klíče `SponsorPayment.sponsorId` + `Sponsorship` zůstávají, ale většina API filtruje `isActive: true` → entita zmizí z UI bez ztráty historie plateb.

---

### 4.10 CSRF cookie name fixní

Klient parsuje cookie regexem `match(/(?:^|;\s*)csrf-token=([^;]+)/)`. Pokud se název cookie změní, rozbije se. Konstanta je ale definována v `src/lib/csrf.ts`.

---

### 4.11 Floating point tolerance

Porovnání součtu split částek používá `AMOUNT_TOLERANCE = 0.01` — standardní workaround pro float aritmetiku.

---

## 5. Integrace

### 5.1 Bank výpis parsing (CSV)

**Směr:** Import.
**Formát:** CSV s povinnými sloupci `datum`, `castka`, `mena` + volitelné `vs`, `odesilatel`, `ucet_odesilatele`, `zprava`. Papa Parse s `transformHeader: lowercase + trim`.
**Validace:** max 10 MB, povinné sloupce, datum a amount parse.
**Datum:** `YYYY-MM-DD`, `DD.MM.YYYY`, `DD/MM/YYYY`.
**Amount:** odstranění mezer, čárka → tečka.
**Currency:** uppercase, default `"CZK"`.
**Chybové stavy:** per-řádek chybová hláška; pokud nejsou žádné valid rows → 400 s `parseErrors`.

**Kde v kódu:** `src/lib/csvParser.ts`, `src/app/api/payment-imports/route.ts`.

---

### 5.2 Bank výpis matching

**Zdroj:** Parsed `PaymentImportRow`.
**Mapování:**
- Duplikát: stejná částka + měna + datum ± 1 den vs. existující `SponsorPayment`/`VoucherPurchase`.
- Sponsor: VS → `User.variableSymbol` / bank account → `User.bankAccount` / fuzzy jméno (diacritics removal, lowercase, strip titles `Ing./Mgr./…`).
- Student: pokud sponsor má **právě 1** aktivní sponzorství → auto-assign; jinak hledání jména v `message`.
- PaymentType: `PAYMENT_TYPE_KEYWORDS` mapa (školné/stravenk/ordinace/kavá/tane/seminář).

**Kde v kódu:** `src/lib/paymentMatcher.ts` (338 ř.).

---

### 5.3 CSV export

**Směr:** Export.
**Funkce:** `downloadCSV(filename, headers, rows)` v `src/lib/csv.ts`.
**BOM:** `'﻿'` prefix.
**Escapování:** hodnoty s `,`/`"`/`\n` → obaleny `""`, vnitřní `"` → `""""`.
**Stránky:** Studenti, Sponzoři, Platby, Předpisy.

---

### 5.4 MyMemory překlad API

**Směr:** Export textu → Import překladu.
**Endpoint:** `https://api.mymemory.translated.net/get?q=...&langpair=cs|en`.
**Timeout:** 5s (`AbortController`).
**Chování:** Dvě paralelní volání (`cs|en`, `cs|sw`) přes `Promise.allSettled`. Pokud oba `rejected` → 502, jinak vrátí `{ en, sw }` (každé může být `null`).
**Rate limit:** 20 / minutu / user.

**Kde v kódu:** `src/app/api/admin/translate/route.ts`.

---

### 5.5 Visit card tisk

**Směr:** Export (tisk).
**Způsob:** Klientský React render → HTML snapshot → iframe → `print()`.
**Layout:** A4, 2 stránky, height `calc(297mm - 16mm)`, flex-fill na last element.

**Kde v kódu:** `src/app/reports/visit-cards/print/page.tsx`, `src/app/api/reports/visit-cards/route.ts`.

---

### 5.6 Fotografie upload

**Směr:** Import.
**Storage:** `public/uploads/<studentId>/<timestamp>-<rand>.<ext>`.
**Validace:** MIME (`image/jpeg|png|webp|gif`), max 10 MB, magic bytes check.
**Klientská komprese:** Canvas API → resize na max 1600px šířka, JPEG 0.8 quality (GIF neupraven). `src/lib/imageUtils.ts`.

---

### 5.7 DB backup/restore

**Export:** Přečtení `prisma/dev.db` jako binary stream, content-disposition attachment, filename `rael-backup-YYYY-MM-DD.db`.
**Restore:** Multi-step validace (SQLite header, tabulky, integrity check, safety backup, revert při selhání).

---

### 5.8 JWT autentizace

**Cookie:** `auth-token`, httpOnly, secure, sameSite: strict, maxAge 24h.
**Secret:** `process.env.JWT_SECRET` nebo auto-generovaný crypto.randomBytes(32). Warn při slabém secretu (<32 chars, obsahuje `rael|school|secret|password|test|demo`).
**Payload:** `{ id, email, firstName, lastName, role }`.

---

## 6. Appendix: Konstanty a konfigurace

### 6.1 Magic konstanty

| Konstanta | Hodnota | Kde | Účel |
|-----------|---------|-----|------|
| `CURRENCIES` | `['CZK', 'EUR', 'USD', 'KES']` | `src/lib/constants.ts:1` | Dropdowny |
| `DEFAULT_VOUCHER_CURRENCY` | `'CZK'` | `src/lib/constants.ts:5` | Nákup stravenek default |
| `DEFAULT_SPONSOR_PAYMENT_CURRENCY` | `'KES'` | `src/lib/constants.ts:6` | Sponzorská platba default |
| `DEFAULT_VOUCHER_RATE_FALLBACK` | `80` | `src/lib/constants.ts:9` | Pokud chybí VoucherRate |
| `AMOUNT_TOLERANCE` | `0.01` | `src/lib/constants.ts:12` | Float porovnání split součtu |
| `API_LIMITS.PAYMENTS` | `1000` | `src/lib/constants.ts:16` | Default take v dotazech |
| `API_LIMITS.DASHBOARD_RECENT` | `10` | `src/lib/constants.ts:17` | Dashboard recent items |
| `MAX_FILE_SIZE` (CSV upload) | `10 MB` | `payment-imports/route.ts:7` | |
| `MAX_FILE_SIZE` (photo) | `10 MB` | `students/[id]/photos/route.ts:34` | |
| `MAX_FILE_SIZE` (DB restore) | `50 MB` | `backup/restore/route.ts:44` | |
| `IMAGE_MAX_WIDTH` | `1600 px` | `src/lib/imageUtils.ts:8` | Komprese |
| `IMAGE_QUALITY` | `0.8` | `src/lib/imageUtils.ts:9` | JPEG |
| `JWT expiry` | `24h` | `src/lib/auth.ts:42` | |
| `bcrypt rounds` | `10` | `src/lib/auth.ts:32` | |
| `CSRF TOKEN_LENGTH` | `32 bytes` | `src/lib/csrf.ts:3` | |

### 6.2 Sazby v seedu

| Entita | Hodnota | Kde |
|--------|---------|-----|
| TuitionRate `PP1–Grade 6` | `3 700 CZK` / rok, `gradeFrom=0`, `gradeTo=7` | `prisma/seed.ts:209` |
| TuitionRate `Grade 7–Grade 12` | `4 700 CZK` / rok, `gradeFrom=8`, `gradeTo=13` | `prisma/seed.ts:210` |
| VoucherRate CZK | `80` | `prisma/seed.ts:219` |
| VoucherRate EUR | `3` | `prisma/seed.ts:220` |
| VoucherRate USD | `3.5` | `prisma/seed.ts:221` |
| VoucherRate KES | `80` | `prisma/seed.ts:222` |

### 6.3 Výchozí uživatelé (seed)

| Role | Email | Heslo |
|------|-------|-------|
| ADMIN | `admin@rael.school` | `admin123` |
| MANAGER | `manager@rael.school` | `manager123` |
| VOLUNTEER | `volunteer@rael.school`, `volunteer2@rael.school`, `volunteer3@rael.school` | `volunteer123` |
| SPONSOR | `<jmeno.prijmeni>@sponsor.rael.school` | `sponsor123` |

### 6.4 Volané externí služby

- **MyMemory Translation API** — `api.mymemory.translated.net` (cs→en, cs→sw). Timeout 5s. Bez API klíče.
- **Žádné jiné externí zdroje** (mapy, emaily, SMS, analytics).

### 6.5 Filesystem závislosti

- `prisma/dev.db` — SQLite DB.
- `prisma/dev.db.primary`, `prisma/dev.db.backup`, `prisma/dev.db.before-restore` — zálohy.
- `public/uploads/<studentId>/` — fotografie.
- `data/students-real.json`, `data/config-real.json` — zdrojová seed data.
- Binárka `sqlite3` (volitelně) — pro validaci tabulek + integrity při restore.

### 6.6 Lokalizace

- **Jazyky:** `cs` (default), `en`, `sw`.
- **Lokalizovaná pole v DB:** `name`, `nameEn`, `nameSw` u všech číselníků.
- **UI texty:** `src/messages/<locale>.json`, translator přes `createTranslator` (dot-notation klíče, `{param}` interpolace).
- **Pravidlo:** každý nový text v UI musí mít klíč ve všech 3 jazycích.

---

**Konec dokumentu.** Pro netechnický souhrn viz `BUSINESS-SUMMARY.md`.
