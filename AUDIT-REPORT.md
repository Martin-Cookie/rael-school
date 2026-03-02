# Rael School – Audit Report – 2026-03-02

> Druhý audit projektu. První audit (45 nálezů) byl kompletně vyřešen v 8 batchích.
> Tento audit reflektuje aktuální stav kódu po všech opravách.

## Souhrn

- **CRITICAL: 12** (8 vyřešeno ✅, 4 otevřeno)
- **HIGH: 16**
- **MEDIUM: 22**
- **LOW: 10**

**Celkem: 60 nálezů (8 vyřešeno v Fázi 1)**

### Fáze 1 — vyřešené CRITICAL nálezy (2026-03-02)

| Commit | Popis |
|--------|-------|
| `c0df120` | Bezpečnost: wildcard image optimizer odstraněn, cookie secure=true, JWT 24h |
| `9940b25` | Sidebar: kompletní dark mode (mobilní header, nav, dropdown, user info) |
| `8aef4f5` | Form inputs: dark mode v 8 tab komponentách |
| `956a549` | Přístupnost: 40 aria-label + Toast role="alert" |
| `332a7a9` | DB indexy: sponsorId na VoucherPurchase/PaymentImportRow, period na TuitionCharge |
| `2b8bbc4` | Error handling: tiché .catch() nahrazeno console.error logováním |

---

## Souhrnná tabulka

| # | Oblast | Soubor | Severity | Problém | Doporučení |
|---|--------|--------|----------|---------|------------|
| 1 | Bezpečnost | `next.config.js:4-8` | ✅ CRITICAL | Wildcard `hostname: '**'` v Image Optimizer — SSRF/DoS | Odstraněno (`c0df120`) |
| 2 | Bezpečnost | `.env:2` | CRITICAL | Slabý, predikovatelný JWT secret | `openssl rand -base64 32` |
| 3 | Bezpečnost | `api/auth/login/route.ts:55` | ✅ CRITICAL | Cookie `secure` jen v produkci + JWT 7d | secure=true, JWT 24h (`c0df120`) |
| 4 | Bezpečnost | Celý projekt | CRITICAL | Žádný audit log (kdo co kdy změnil) | Implementovat audit trail |
| 5 | Bezpečnost | `package.json` | CRITICAL | Next.js 14.2.18 — známé CVE (GHSA-9g9p, GHSA-h25m) | Upgrade na nejnovější patch |
| 6 | UI | `components/layout/Sidebar.tsx:72-186` | ✅ CRITICAL | Sidebar nemá žádné `dark:` třídy | Kompletní dark mode (`9940b25`) |
| 7 | UI | Více tab komponent | ✅ CRITICAL | Form inputy bez `dark:bg-gray-700` | 8 komponent opraveno (`8aef4f5`) |
| 8 | UI | Více formulářů | ✅ CRITICAL | Inputy bez `<label>` nebo `aria-label` (WCAG A) | 40 aria-label přidáno (`956a549`) |
| 9 | Výkon | `api/statistics/route.ts:31-52` | CRITICAL | `take: 5000` bez paginace | Cachovat agregace, přidat filtr |
| 10 | Výkon | `api/dashboard/route.ts:63-84` | CRITICAL | Dashboard načítá 1000+ záznamů najednou | Agregovat server-side |
| 11 | Výkon | `prisma/schema.prisma` | ✅ CRITICAL | Chybí indexy: VoucherPurchase.sponsorId, PaymentImportRow.sponsorId, TuitionCharge.period | Přidáno (`332a7a9`) |
| 12 | Error | 10+ stránek | ✅ CRITICAL | `.catch(() => {})` — tiché selhání fetch volání | console.error logování (`2b8bbc4`) |
| 13 | Bezpečnost | `lib/auth.ts:29` | HIGH | JWT expirace 7 dní — příliš dlouhá | Snížit na 1–2 hodiny + refresh token |
| 14 | Bezpečnost | `api/students/[id]/photos/route.ts:29-36` | HIGH | File upload validuje jen MIME type, ne obsah | Validovat magic bytes (`file-type`) |
| 15 | Bezpečnost | `api/admin/backup/restore/route.ts` | HIGH | DB restore bez rate limitu a potvrzení | Přidat approval workflow |
| 16 | Bezpečnost | `api/admin/backup/json/route.ts` | HIGH | Bulk export bez rate limitu a audit logu | Přidat rate limit + logování |
| 17 | Kód | Split + Approve routes | HIGH | Duplicitní logika detekce voucher typů | Extrahovat do utility |
| 18 | Kód | Více souborů | HIGH | Hardcoded fallback `80` pro voucher rate | Přesunout do `constants.ts` |
| 19 | Kód | Více souborů | HIGH | Nekonzistentní default měny (CZK vs KES) | Centralizovat konstanty |
| 20 | Dokument | `CLAUDE.md:151-163` | HIGH | Dokumentuje 9 záložek, ve skutečnosti 10 (chybí Školné) | Aktualizovat |
| 21 | Dokument | `CLAUDE.md:50` | HIGH | „Stravenky jsou vždy v KES" — nepravda | Opravit |
| 22 | Dokument | CLAUDE.md | HIGH | 45 API endpointů bez dokumentace | Vytvořit API Reference |
| 23 | UI | `components/Toast.tsx` | HIGH | Chybí `aria-live` a `role="alert"` | Přidat pro screen readery |
| 24 | UI | `Sidebar.tsx:72` | HIGH | Mobilní header bez dark mode | Přidat dark varianty |
| 25 | UI | `students/new/page.tsx:64-130` | HIGH | Formulář bez validačních zpráv | Přidat error feedback |
| 26 | Výkon | `api/sponsors/route.ts:62-70` | HIGH | Agregace plateb v JS místo SQL | Použít `prisma.groupBy()` |
| 27 | Výkon | `api/tuition-charges/route.ts:48-95` | HIGH | O(n²) filtrování plateb ke školnému | Pre-organizovat do Map |
| 28 | Error | `api/students/[id]/route.ts:98-122` | HIGH | PUT/DELETE nepoužívá `isNotFoundError()` | Přidat 404 handling |
| 29 | Testy | `lib/paymentMatcher.ts` | HIGH | 368 řádků business logiky bez testů | Napsat test suite |
| 30 | Testy | `lib/csvParser.ts` | HIGH | CSV parsing bez testů | Napsat testy |
| 31 | Testy | `lib/auth.ts` | HIGH | Auth funkce bez testů | Napsat unit testy |
| 32 | Bezpečnost | Všechny POST endpointy | MEDIUM | Žádná CSRF ochrana | Přidat CSRF tokeny |
| 33 | Bezpečnost | `api/students/route.ts:82-90` | MEDIUM | Validace jen délky, ne obsahu | Použít `zod` schema |
| 34 | Bezpečnost | Všechny odpovědi | MEDIUM | Chybí security headers (CSP, HSTS) | Přidat v `headers()` |
| 35 | Bezpečnost | Více endpointů | MEDIUM | Nekonzistentní auth checks | Centralizovat helpers |
| 36 | Bezpečnost | `prisma/dev.db.primary` | MEDIUM | DB zálohy s citlivými daty v git historii | Přesunout mimo repo |
| 37 | Bezpečnost | Více endpointů | MEDIUM | Rate limiting jen na login | Rozšířit na upload, export |
| 38 | Kód | `payments/import/[id]/page.tsx` | MEDIUM | 839 řádků — těžko testovatelný | Rozdělit na komponenty |
| 39 | Kód | `reports/page.tsx` | MEDIUM | 705 řádků | Extrahovat sekce |
| 40 | Kód | `students/[id]/page.tsx:31-77` | MEDIUM | 52 useState hooků | Seskupit do custom hooků |
| 41 | Kód | `students/[id]/page.tsx:116-150` | MEDIUM | 10+ identických fetch funkcí | Vytvořit `fetchList<T>()` |
| 42 | Kód | Více souborů | MEDIUM | `0.01` tolerance hardcoded | Extrahovat `AMOUNT_TOLERANCE` |
| 43 | Dokument | CLAUDE.md | MEDIUM | Chybí popis paymentMatcher algoritmu | Vytvořit docs/PAYMENT-MATCHING.md |
| 44 | Dokument | `src/lib/*.ts` | MEDIUM | Utility funkce bez JSDoc | Přidat JSDoc |
| 45 | UI | Více stránek | MEDIUM | Nekonzistentní button padding | Definovat size systém |
| 46 | UI | Více tab komponent | MEDIUM | Některé inputy chybí `dark:bg-gray-700` | Sjednotit |
| 47 | UI | `components/SortHeader.tsx` | MEDIUM | `<th>` bez keyboard handlerů | Přidat `onKeyDown`, `tabIndex` |
| 48 | UI | `Sidebar.tsx:126-145` | MEDIUM | Dropdown bez Escape a arrow navigace | Přidat keyboard handlery |
| 49 | UI | Formuláře plateb | MEDIUM | Chybí focus trap v panelech | Implementovat focus trap |
| 50 | UI | `Pagination.tsx:58-68` | MEDIUM | Tlačítka bez `aria-label`, `aria-current` | Přidat |
| 51 | UI | Více komponent | MEDIUM | Focus ring v dark mode špatně viditelný | `dark:focus:ring-primary-400` |
| 52 | Výkon | Více API endpointů | MEDIUM | Odpovědi bez `select:` — zbytečná data | Přidat `select: {}` |
| 53 | Error | `api/payments/route.ts:81,105` | MEDIUM | `parseFloat()` bez NaN kontroly | Validovat před uložením |
| 54 | Error | `api/.../approve/route.ts:78` | MEDIUM | `\|\|` místo `??` — 0 je falsy | Použít nullish coalescing |
| 55 | Git | `.gitignore` | MEDIUM | Chybí `.vscode/`, `.idea/`, `coverage/` | Doplnit |
| 56 | Kód | Více stránek | LOW | Přímý localStorage bez encapsulace | Vytvořit `useLocalStorage` hook |
| 57 | Kód | `import/[id]/page.tsx:654` | LOW | Komplexní IIFE v JSX | Extrahovat do helper funkce |
| 58 | UI | Více stránek | LOW | Nekonzistentní icon sizes (w-4/w-5/w-6) | Definovat icon size systém |
| 59 | UI | Heading hierarchy | LOW | Smíšené h1/h2/h3 | Standardizovat |
| 60 | Testy | Celý projekt | LOW | Žádné E2E testy | Přidat Playwright testy |

---

## Detailní nálezy

### 1. Kódová kvalita

#### 1.1 Duplikáty a opakující se vzory

**Duplicitní logika detekce voucher typů (HIGH, #17)**
- `api/payment-imports/[id]/rows/[rowId]/split/route.ts:60-62`
- `api/payment-imports/[id]/approve/route.ts:51-54`
- Identický kód:
  ```ts
  const voucherTypeIds = allPaymentTypes
    .filter(pt => pt.name.toLowerCase().includes('stravenk') || pt.name.toLowerCase().includes('voucher'))
    .map(pt => pt.id)
  ```
- **Doporučení:** Extrahovat do `src/lib/paymentTypes.ts`:
  ```ts
  export function isVoucherPaymentType(name: string): boolean
  export function getVoucherTypeIds(types: PaymentType[]): string[]
  ```

**Hardcoded fallback `80` pro voucher rate (HIGH, #18)**
- `api/payment-imports/[id]/approve/route.ts:77` — `|| 80`
- `api/payment-imports/[id]/rows/[rowId]/split/route.ts:139`
- **Doporučení:** `export const DEFAULT_VOUCHER_RATE_FALLBACK = 80` v `constants.ts`

**Magic number `0.01` pro porovnání částek (MEDIUM, #42)**
- `payments/import/[id]/page.tsx:419`
- `api/payment-imports/[id]/rows/[rowId]/split/route.ts:45`
- **Doporučení:** `export const AMOUNT_TOLERANCE = 0.01` v `constants.ts`

**10+ identických fetch funkcí (MEDIUM, #41)**
- `students/[id]/page.tsx:116-150`
- Všechny mají identický try-catch pattern
- **Doporučení:** Generická `fetchList<T>(url, setter)` utility

#### 1.2 Velké soubory a komponenty

| Soubor | Řádky | Severity | # |
|--------|-------|----------|---|
| `payments/import/[id]/page.tsx` | 839 | MEDIUM | 38 |
| `reports/page.tsx` | 705 | MEDIUM | 39 |
| `students/[id]/page.tsx` | 619 | MEDIUM | 40 |
| `payments/page.tsx` | 546 | MEDIUM | — |
| `reports/visit-cards/print/page.tsx` | 540 | MEDIUM | — |

#### 1.3 Nadměrný state management (MEDIUM, #40)

- `students/[id]/page.tsx:31-77` — **52 useState hooků** v jednom komponentu
- **Doporučení:** Seskupit do custom hooků nebo `useReducer`

#### 1.4 Nekonzistentní default měny (HIGH, #19)

| Soubor | Řádek | Default |
|--------|-------|---------|
| `payments/page.tsx` | 48 | `'CZK'` |
| `payments/page.tsx` | 224, 234 | `'KES'` |
| `students/[id]/page.tsx` | 59 | `'CZK'` |
| `students/[id]/page.tsx` | 41 | `'KES'` |

**Doporučení:** `DEFAULT_VOUCHER_CURRENCY`, `DEFAULT_SPONSOR_PAYMENT_CURRENCY` v `constants.ts`

---

### 2. Bezpečnost

#### 2.1 CRITICAL: Wildcard v Image Optimizer (#1)

**Soubor:** `next.config.js:4-8`
```javascript
images: {
  remotePatterns: [{ protocol: 'https', hostname: '**' }]
}
```
- Umožňuje SSRF, DoS přes Image Optimizer
- Známá CVE: GHSA-9g9p-9gw9-jx7f
- **Doporučení:** Whitelist konkrétní domény nebo zakázat remote images

#### 2.2 CRITICAL: Slabý JWT secret (#2)

**Soubor:** `.env:2` — `JWT_SECRET="rael-school-jwt-secret-2026"`
- Predikovatelný formát, snadno uhodnutelný
- **Doporučení:** `openssl rand -base64 32`, v produkci secrets management

#### 2.3 CRITICAL: Cookie secure flag jen v produkci (#3)

**Soubor:** `api/auth/login/route.ts:53-58`
```ts
response.cookies.set('auth-token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7,
})
```

#### 2.4 CRITICAL: Žádný audit trail (#4)

- Žádné logování: kdo změnil/smazal data, kdo exportoval, kdo obnovil DB
- Kritické pro GDPR a compliance
- **Doporučení:** Audit log tabulka (userId, action, timestamp, IP, changes)

#### 2.5 CRITICAL: Zastaralý Next.js s CVE (#5)

- Next.js 14.2.18 má známé zranitelnosti
- GHSA-9g9p-9gw9-jx7f: DoS via Image Optimizer
- GHSA-h25m-26qc-wcjf: HTTP request deserialization DoS
- **Doporučení:** Upgrade na nejnovější patch verzi

#### 2.6 HIGH: JWT expirace 7 dní (#13)

**Soubor:** `lib/auth.ts:29` — `expiresIn: '7d'`
- Kompromitovaný token platí celý týden
- **Doporučení:** 1–2 hodiny + refresh token mechanismus

#### 2.7 HIGH: File upload jen MIME validace (#14)

**Soubor:** `api/students/[id]/photos/route.ts:29-36`
- Kontroluje jen `file.type`, ne skutečný obsah souboru (magic bytes)
- MIME type je snadno spoofovatelný
- **Doporučení:** Použít `file-type` knihovnu pro validaci obsahu

#### 2.8 HIGH: DB restore bez ochrany (#15)

**Soubor:** `api/admin/backup/restore/route.ts`
- Žádný rate limit, approval workflow, ani audit log
- Kompromitovaný admin může přepsat celou DB
- **Doporučení:** Approval workflow, rate limit (1/den), audit log

#### 2.9 HIGH: Bulk export bez ochrany (#16)

**Soubor:** `api/admin/backup/json/route.ts:35-55`
- Načte celou DB bez paginace
- Žádný rate limit ani audit logování
- **Doporučení:** Rate limit + logování kdo a kdy exportoval

#### 2.10 MEDIUM: Chybí CSRF ochrana (#32)

- Žádné CSRF tokeny na POST/PUT/DELETE endpointech
- SameSite=strict na cookie je částečná ochrana, ale ne dostatečná

#### 2.11 MEDIUM: Chybí security headers (#34)

Chybí: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`, `Referrer-Policy`

#### 2.12 MEDIUM: Nekonzistentní auth checks (#35)

Různé vzory:
- `isAdmin(user.role)` vs `user.role !== 'ADMIN'` vs `['ADMIN','MANAGER'].includes(user.role)`
- **Doporučení:** Centralizované permission helpers

#### 2.13 MEDIUM: DB zálohy v git historii (#36)

- `prisma/dev.db.primary` obsahuje kompletní data (osobní údaje studentů, platby, zdraví)
- I po smazání zůstává v git historii

#### 2.14 MEDIUM: Rate limiting jen na login (#37)

- Chybí na: file upload, CSV export, DB restore, bulk operace
- **Doporučení:** Per-user rate limiter na citlivé endpointy

---

### 3. Dokumentace

#### 3.1 HIGH: CLAUDE.md — 9 vs 10 záložek (#20)

**Soubor:** `CLAUDE.md:151-163`
- Dokumentuje 9 záložek, ale kód má 10 (chybí Školné/Tuition)
- Pořadí záložek v dokumentaci neodpovídá pořadí v kódu

#### 3.2 HIGH: Nepravdivé tvrzení o stravenkách (#21)

**Soubor:** `CLAUDE.md:50`
- „Stravenky jsou vždy v KES" — neodpovídá realitě
- Stravenky (VoucherPurchase) mohou být v libovolné měně

#### 3.3 HIGH: 45 API endpointů bez dokumentace (#22)

Chybí sekce „API Reference" s popisem:
- Metody (GET/POST/PUT/DELETE)
- Parametry a request body
- Response formát
- Auth požadavky

Zjištěné API routes (45):
- `/api/admin/*` (13 routes) — správa číselníků, backup, restore
- `/api/auth/*` (3 routes) — login, logout, me
- `/api/dashboard/*` (1 route)
- `/api/payment-imports/*` (6 routes)
- `/api/payments/*` (1 route)
- `/api/reports/*` (1 route)
- `/api/sponsors/*` (4 routes)
- `/api/statistics/*` (1 route)
- `/api/students/*` (10 routes)
- `/api/tuition-charges/*` (1 route)
- `/api/tuition-rates/*` (1 route)
- `/api/voucher-rates/*` (1 route)

#### 3.4 MEDIUM: Chybí dokumentace paymentMatcher (#43)

- `src/lib/paymentMatcher.ts` — 368 řádků komplexního matching algoritmu
- Interní step komentáře existují, ale chybí high-level dokumentace
- **Doporučení:** Vytvořit `docs/PAYMENT-MATCHING.md`

#### 3.5 MEDIUM: Utility funkce bez JSDoc (#44)

| Soubor | Exportovaných funkcí | JSDoc |
|--------|:---:|:---:|
| `format.ts` | 6 | 0 |
| `auth.ts` | 10+ | 0 |
| `imageUtils.ts` | 2 | částečně |
| `csv.ts` | 1 | ano |
| `rateLimit.ts` | 1 | ano |

---

### 4. UI / Šablony

#### 4.1 CRITICAL: Sidebar bez dark mode (#6)

**Soubor:** `components/layout/Sidebar.tsx:72-186`
- Celý sidebar má **nulové** `dark:` třídy
- Ovlivněno: mobilní header (řádek 72), navigace, language switcher (řádek 134), user info (řádek 163)
- V dark mode je oslepující bílý

**Doporučení:**
- `bg-white` → `bg-white dark:bg-gray-800`
- `border-gray-200` → `border-gray-200 dark:border-gray-700`
- `text-gray-600` → `text-gray-600 dark:text-gray-300`

#### 4.2 CRITICAL: Form inputy bez dark mode (#7)

**Soubory:** VouchersTab.tsx:67-88, HealthTab.tsx:41-43, NeedsTab.tsx:45, payments/page.tsx:357-404
- `<select>`, `<input>`, `<textarea>` chybí `dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`
- Bílé inputy na tmavém pozadí jsou nečitelné

#### 4.3 CRITICAL: Inputy bez labels — WCAG A (#8)

- VouchersTab:68 — `<select>` bez id nebo label
- HealthTab:41-43 — 3 formulářová pole bez labels
- payments/page.tsx:357-404 — více polí v gridu bez labels
- **Porušení:** WCAG 2.1 Level A, kritérium 1.3.1

#### 4.4 HIGH: Toast bez aria-live (#23)

**Soubor:** `components/Toast.tsx:5-12`
```tsx
<div className={`fixed top-4 right-4 z-50 ...`}>
  {message.text}
</div>
```
- Chybí `aria-live="polite"` a `role="alert"`
- Screen reader uživatelé nevidí notifikace

#### 4.5 HIGH: Mobilní header bez dark mode (#24)

**Soubor:** `Sidebar.tsx:72`
- `bg-white border-gray-200` bez `dark:` variant

#### 4.6 HIGH: Formuláře bez validačních zpráv (#25)

**Soubor:** `students/new/page.tsx:64-130`
- Žádné error messages, `aria-invalid`, `aria-describedby`
- Porušení WCAG 3.3.1 (Error Identification)

#### 4.7 MEDIUM: Nekonzistentní button padding (#45)

| Kontext | Padding |
|---------|---------|
| Export tlačítka | `px-4 py-2.5` |
| Inline akce | `px-3 py-2` |
| Form submit | `px-6 py-3` |
| Filtry | `px-4 py-2` |

**Doporučení:** Definovat sm/md/lg button size systém

#### 4.8 MEDIUM: SortHeader bez keyboard navigace (#47)

**Soubor:** `components/SortHeader.tsx:17-29`
- `<th>` je klikatelný, ale chybí `onKeyDown`, `tabIndex={0}`
- **Doporučení:** Přidat `onKeyDown={(e) => e.key === 'Enter' && onSort(col)}`

#### 4.9 MEDIUM: Dropdown bez keyboard handlerů (#48)

**Soubor:** `Sidebar.tsx:126-145`
- Language switcher: chybí Escape pro zavření, ArrowDown/Up pro navigaci

#### 4.10 MEDIUM: Chybí focus trap (#49)

- Otevřené formuláře (showAddForm, showAddVoucher) — fokus uniká do pozadí
- **Doporučení:** Focus trap + focus restoration při zavření

#### 4.11 MEDIUM: Touch targets pod 44×44px

- Pagination tlačítka `p-2` — pod WCAG AA minimum
- **Doporučení:** `min-h-[44px] min-w-[44px]`

---

### 5. Výkon

#### 5.1 CRITICAL: Statistics endpoint — `take: 5000` (#9)

**Soubor:** `api/statistics/route.ts:31-52`
- Načítá 5000 záznamů bez paginace pro 3 entity
- **Doporučení:** Server-side agregace, cache, time-based filtr

#### 5.2 CRITICAL: Dashboard — 3000+ záznamů (#10)

**Soubor:** `api/dashboard/route.ts:63-84`
- `sponsorPayments.take: 1000` + `voucherPurchases.take: 1000` + `tuitionCharges.take: 1000`
- Dashboard zobrazuje jen souhrny, nepotřebuje surová data
- **Doporučení:** Agregovat server-side, vracet jen statistiky + posledních 50 transakcí

#### 5.3 CRITICAL: Chybějící DB indexy (#11)

| Model | Sloupec | Dotazy kde chybí |
|-------|---------|-----------------|
| VoucherPurchase | sponsorId | Payment import approval |
| PaymentImportRow | sponsorId | Bulk operace |
| TuitionCharge | period | Filtr `?period=2026` |

#### 5.4 HIGH: Sponsor platby agregovány v JS (#26)

**Soubor:** `api/sponsors/route.ts:62-70`
- Načte všechny platby do paměti, sčítá v JS cyklu
- **Doporučení:** `prisma.sponsorPayment.groupBy({ by: ['sponsorId','currency'], _sum: { amount: true } })`

#### 5.5 HIGH: O(n²) filtrování u školného (#27)

**Soubor:** `api/tuition-charges/route.ts:48-95`
- Pro každý předpis filtruje celé pole plateb
- 1000 předpisů × 5000 plateb = 5M porovnání
- **Doporučení:** `Map<studentId, Payment[]>` místo `.filter()` v cyklu

#### 5.6 MEDIUM: API odpovědi bez `select:` (#52)

- Více endpointů vrací celé objekty včetně nepotřebných relací
- Odhadovaná úspora: 20–30% velikosti odpovědi

---

### 6. Error Handling

#### 6.1 CRITICAL: Tiché `.catch(() => {})` (#12)

**Soubory:** payments/page.tsx, tuition/page.tsx, students/[id]/page.tsx, students/new/page.tsx (10+ míst)
```tsx
fetch('/api/...').then(r => r.json()).then(d => setData(d)).catch(() => {})
```
- UI se jeví jako prázdné bez jakékoliv zpětné vazby
- **Doporučení:** Zobrazit toast notifikaci, logovat chybu

#### 6.2 HIGH: PUT/DELETE bez 404 handling (#28)

**Soubor:** `api/students/[id]/route.ts:98-122`
- Prisma P2025 error vrací 500 místo 404
- Ostatní endpointy (payments) to řeší správně
- **Doporučení:** Přidat `isNotFoundError()` check

#### 6.3 MEDIUM: parseFloat bez NaN kontroly (#53)

**Soubor:** `api/payments/route.ts:81,105`
```ts
amount: parseFloat(amount)  // Může být NaN
count: parseInt(count)      // Může být NaN
```
- **Doporučení:** `if (isNaN(parseFloat(amount))) return NextResponse.json({error: ...}, {status: 400})`

#### 6.4 MEDIUM: Falsy check místo nullish coalescing (#54)

**Soubor:** `api/payment-imports/[id]/approve/route.ts:78`
```ts
const voucherCount = row.voucherCount || Math.floor(row.amount / rate)
```
- `voucherCount === 0` je falsy → přepočítá se místo 0
- **Doporučení:** `row.voucherCount ?? Math.floor(...)`

---

### 7. Git Hygiene

#### 7.1 MEDIUM: Neúplný .gitignore (#55)

Chybí:
```
.vscode/
.idea/
coverage/
dist/
.turbo/
```

#### 7.2 MEDIUM: DB zálohy v git historii (#36)

- `prisma/dev.db.primary` a `prisma/dev.db.backup` v git historii
- Obsahují kompletní data studentů (osobní údaje, platby, zdravotní záznamy)

---

### 8. Testy

#### 8.1 Existující testy (2 soubory)

| Test soubor | Pokrytí |
|-------------|---------|
| `src/__tests__/format.test.ts` | 6 funkcí, dobré ✓ |
| `src/__tests__/rateLimit.test.ts` | 5 scénářů, dobré ✓ |

#### 8.2 Chybějící testy

| Modul | Řádky | Komplexita | Testy | Severity | # |
|-------|:-----:|:----------:|:-----:|----------|---|
| `lib/paymentMatcher.ts` | 368 | Velmi vysoká | ✗ | HIGH | 29 |
| `lib/csvParser.ts` | 124 | Vysoká | ✗ | HIGH | 30 |
| `lib/auth.ts` | ~100 | Střední | ✗ | HIGH | 31 |
| `lib/db.ts` | ~20 | Nízká | ✗ | — | — |
| `lib/tuition.ts` | 63 | Střední | ✗ | — | — |
| 44 API routes | ~5000 | Vysoká | ✗ | — | — |
| 36 page komponent | ~8000 | Vysoká | ✗ | — | — |

**Odhadované pokrytí:** < 5% kódu

#### 8.3 Chybějící E2E testy (LOW, #60)

Žádné E2E testy pro:
- Import plateb (upload → match → split → approve)
- Přihlášení s rate limitingem
- CRUD studentů s validací
- Generování předpisů školného

---

## Doporučený postup oprav

### Fáze 1 — CRITICAL (před nasazením do produkce)

1. **#1** Opravit `next.config.js` — wildcard hostname → whitelist
2. **#2** Vygenerovat silný JWT secret
3. **#3** Secure cookie vždy = true
4. **#5** Upgrade Next.js na nejnovější patch
5. **#6** Přidat dark mode na Sidebar (celý komponent)
6. **#7** Přidat dark varianty na form inputy
7. **#8** Přidat `aria-label` / `<label>` na všechny inputy
8. **#11** Přidat chybějící DB indexy
9. **#12** Nahradit `.catch(() => {})` za toast notifikace
10. **#9, #10** Optimalizovat statistics a dashboard endpointy

### Fáze 2 — HIGH (brzy po nasazení)

11. **#13** Zkrátit JWT expiraci + refresh token
12. **#14** Validovat file upload obsah (magic bytes)
13. **#15, #16** Rate limit na restore, export
14. **#17, #18, #19** Extrahovat duplicitní logiku a konstanty
15. **#20, #21, #22** Opravit CLAUDE.md (záložky, stravenky, API ref)
16. **#23** Toast: `aria-live="polite" role="alert"`
17. **#24, #25** Dark mode mobilní header, form validace
18. **#26, #27** Server-side agregace (sponzoři, školné)
19. **#28** Přidat `isNotFoundError()` na student PUT/DELETE
20. **#29, #30, #31** Napsat testy pro paymentMatcher, csvParser, auth

### Fáze 3 — MEDIUM (plánované iterace)

21. **#32, #34** CSRF ochrana, security headers
22. **#38, #39** Rozdělit velké komponenty
23. **#40, #41** Redukovat useState, generická fetch utility
24. **#45, #47, #48** Button padding, keyboard navigace
25. **#49, #50, #51** Focus trap, aria-label, focus ring
26. **#52** Přidat `select: {}` na API odpovědi
27. **#53, #54** NaN validace, nullish coalescing

### Fáze 4 — LOW (nice-to-have)

28. **#56, #57** localStorage hook, IIFE refactoring
29. **#58, #59** Icon size systém, heading hierarchy
30. **#60** E2E testy (Playwright)
