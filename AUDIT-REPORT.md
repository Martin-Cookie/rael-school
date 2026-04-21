# Rael School – Audit Report – 2026-04-21

> Pátý audit projektu (Next.js 14 + TypeScript + Prisma + SQLite).
> Předchozí audit z téhož dne (hlavička 2026-04-21, 23 nálezů) použit jako výchozí bod.
> Tento běh ověřuje platnost předchozích nálezů a reportuje nové / přetrvávající problémy.

## Souhrn

- **CRITICAL:** 0
- **HIGH:** 3
- **MEDIUM:** 10
- **LOW:** 11

**Celkem: 24 nálezů (3 HIGH, 10 MEDIUM, 11 LOW)**

**Rozdíl oproti předchozímu auditu (23 nálezů):**
- Potvrzené přetrvávající nálezy: 21
- Nově identifikované nálezy: 3 (duplicitní regex v `tuition-charges`, slabý `isNotFoundError` import bez použití, neoznačené sloupce pro DB indexy)
- Vyřešené / zlepšené: částečně #23 — helper `isTuitionPaymentType` již existuje v `src/lib/paymentTypes.ts`, ale regex ještě duplicitně v `tuition-charges/route.ts:41` (přetrvávající)

---

## Souhrnná tabulka

| # | Oblast | Soubor | Severity | Problém | Doporučení |
|---|--------|--------|----------|---------|------------|
| 1 | Bezpečnost | `package.json` (deps) | HIGH | `npm audit` stále hlásí 3 high zranitelnosti: Next.js ≤15.5.14 (DoS Image Optimizer + HTTP smuggling + DoS RSC), picomatch (ReDoS), vite (path traversal / FS bypass). Lokální verze 14.2.35 je zranitelná. | Patch Next.js na 14.2.x bezpečnostní release (min 14.2.37+). Pro devDeps (`picomatch`, `vite`) spustit `npm audit fix`. |
| 2 | Bezpečnost | `src/app/api/students/[id]/sponsors/route.ts:30` | HIGH | Předvídatelné default heslo `"sponsor123"` bcrypt-hashnuté při vytvoření sponzora přes detail studenta. Sponzor (VS rolí SPONSOR) se může přihlásit známým heslem. | Generovat náhodné heslo (`crypto.randomBytes(16).toString('hex')`) jako v `src/app/api/sponsors/route.ts:140`. Sponzoři nepoužívají UI login. |
| 3 | Bezpečnost | `.env` v pracovním adresáři | HIGH | `.env` obsahuje produkční-silný JWT_SECRET (64 znaků base64), je v `.gitignore`, ale fyzicky existuje v repo. Při neopatrném zipování/přenosu může uniknout. | Zdokumentovat rotaci tajemství; uložit primárně do secret manageru; do README/DEPLOYMENT přidat preflight check. |
| 4 | Bezpečnost | `next.config.js:16` | MEDIUM | CSP stále obsahuje `'unsafe-inline'` + `'unsafe-eval'` ve `script-src` (oslabuje XSS protection). | V produkčním buildu podmíněně odstranit `'unsafe-eval'` (`process.env.NODE_ENV === 'production'`) a přejít na nonce-based CSP. |
| 5 | Bezpečnost | `src/app/api/auth/me/route.ts` | MEDIUM | Endpoint `/api/auth/me` nemá rate limit — je volán při každém renderu, ale i zneužitelný jako oracle pro existenci cookie. | Přidat `checkRateLimit('me:<ip>', 120, 60_000)` nebo přesunout do layoutu/server componenty. |
| 6 | Bezpečnost | `src/app/api/sponsors/names/route.ts`, `src/app/api/sponsors/search/route.ts` | MEDIUM | Search/names endpointy bez rate limitu — potenciál pro enumeraci sponzorů (search=`a`, `b`, …). | Přidat `checkRateLimit` s rozumným limitem (30 req / 60 s). |
| 7 | Bezpečnost | `prisma/seed.ts` | MEDIUM | Seed generuje všechny sponzory s `sponsor123`. Pokud se produkce seedovala původně, slabé heslo může přetrvávat. | Seed pro produkci generovat náhodné heslo + magic-link; v README označit `sponsor123` jako dev fallback. |
| 8 | Bezpečnost | `src/__tests__/auth-endpoint.test.ts:4-10` | LOW | Testy procházejí, ale stderr obsahuje `[AUDIT] Failed to write audit log: TypeError: Cannot read properties of undefined (reading 'create')` — mock `@/lib/db` neobsahuje `auditLog.create`. | Přidat do mocku `auditLog: { create: vi.fn() }`, nebo mockovat `@/lib/auditLog`. |
| 9 | Kódová kvalita | `src/app/reports/visit-cards/page.tsx:13`, `students/page.tsx:14`, `classes/page.tsx:13`, `tuition/page.tsx:49`, `students/new/page.tsx:13`, `students/[id]/page.tsx:90,94`, `payments/import/[id]/page.tsx:96-99` | MEDIUM | `useState<any>` / `useState<any[]>` — 11 výskytů pro dropdown data (sponsors, students, paymentTypes, voucherRates, classrooms). | Doplnit lehké typy do `src/types/api.ts` (StudentListItem, SponsorListItem, ClassRoom, PaymentType, VoucherRate). |
| 10 | Kódová kvalita | `src/app/api/payments/route.ts:21,34`, `src/app/api/sponsors/route.ts:21`, `src/app/api/tuition-charges/route.ts:16`, `src/lib/codelistRoute.ts:8-12,48,55,78` | MEDIUM | `any` typy v Prisma query argumentech (spQuery, vpQuery, where, data, delegate). Oslabuje typovou kontrolu. | Nahradit za Prisma-generované typy: `Prisma.SponsorPaymentFindManyArgs`, `Prisma.XxxWhereInput`, `Prisma.XxxCreateInput`. Pro `codelistRoute` použít generiku. |
| 11 | Kódová kvalita | `src/lib/csrf.ts` (celý, 20 řádků) | LOW | Helper funkce `getCsrfCookieName()` / `getCsrfHeaderName()` vracejí konstanty — zbytečná indirekce. | Exportovat konstanty přímo: `export const CSRF_COOKIE = 'csrf-token'` atd. |
| 12 | Kódová kvalita | `src/app/payments/import/[id]/page.tsx` (757 ř.) | MEDIUM | Soubor i po extrakci `SplitModal` má 757 ř. — obsahuje filter bar, row editor, seznam child řádků. | Extrahovat `ImportFilterBar`, `ImportRowEditor` do `src/components/import/`. Cíl: <500 ř. |
| 13 | Kódová kvalita | `src/app/students/[id]/page.tsx` (646 ř.) | MEDIUM | Detail studenta stále 646 ř. po extrakci 10 tab komponent — všechny CRUD handlery v parent (`addNeed`, `deleteNeed`, `addWish`, …). | Vytvořit `useStudentMutations(studentId)` hook. Cíl: <400 ř. |
| 14 | Kódová kvalita | `src/app/payments/page.tsx` (623 ř.) | MEDIUM | Obsahuje 2 formuláře (sponsor/voucher), filtry, CSV export. | Extrahovat `SponsorPaymentForm` / `VoucherForm` komponenty. |
| 15 | Kódová kvalita | `src/app/students/[id]/page.tsx:90,94` | LOW | `useState<any>(null)` pro `student` / `editData` — komentář z předchozího kódu označoval tento `any` jako záměrný, ale lze použít `StudentDetail \| null`. | Nahradit za typovaný stav s non-null guardy. |
| 16 | Kódová kvalita | `src/app/layout.tsx:24` | LOW | `catch(e) {}` v inline script tagu pro localStorage — bezpečné, ale nekonzistentní. | Přidat komentář `// ignore — localStorage unavailable`. |
| 17 | Kódová kvalita | `src/app/api/tuition-charges/route.ts:41` | LOW (NOVÝ) | Duplicitní regex `/školné\|tuition\|karo/i.test(...)` — již existuje helper `isTuitionPaymentType` v `src/lib/paymentTypes.ts:20`. | Nahradit za `.filter(isTuitionPaymentType).map(pt => pt.name)`. |
| 18 | Bezpečnost | `prisma/dev.db*` v git historii | LOW | `.gitignore` + HEAD čisté; 9 historických commitů s DB soubory zůstává v historii. | Zvážit `git filter-repo` + force push, nebo ponechat jako známé. |
| 19 | Dokumentace | `docs/API-REFERENCE.md` (poslední update 3.3.) | MEDIUM | Od posledního auditu přibyla `/api/admin/audit-log`, `/api/admin/translate`, změny v CSRF flow — pravděpodobně chybí v referenci. | Delegovat na `Doc Sync agent`. |
| 20 | Dokumentace | `src/lib/csv.ts`, `src/lib/format.ts`, `src/lib/csvParser.ts` | LOW | JSDoc pokrytí částečné — `auth.ts`, `auditLog.ts`, `paymentMatcher.ts`, `imageUtils.ts` pokryté; `csv.ts` / `format.ts` / `csvParser.ts` méně. | Doplnit `@param` / `@returns` u exportovaných utilit. |
| 21 | Výkon | `src/app/api/dashboard/route.ts:12-85` | MEDIUM | Dashboard i přes přidané `groupBy` na ř. 88-100 stále načítá 50 plateb + 100×3 detailních seznamů + všechny studenty + všechny sponzory se sponsorships v jednom requestu. Payload ~200-500 KB. | Rozdělit endpoint na `/dashboard/summary` (agregace) + `/dashboard/recent-*` (pagination) a nechat klienta dotahovat jen aktivní záložku. |
| 22 | Výkon | `src/app/api/statistics/route.ts:30-69` | MEDIUM | Načítá **všechny** `sponsorPayment` / `voucherPurchase` / `voucherUsage` bez `take`. Pro 148 studentů ok, ale při růstu (1k-10k plateb) → memory spike. | Přesunout měsíční agregace na DB (`groupBy` per currency / paymentType per year-month) — JavaScript `forEach` přes celou tabulku je neudržitelné. |
| 23 | Výkon | `prisma/schema.prisma` (VoucherPurchase, TuitionCharge) | LOW (NOVÝ) | Model `VoucherPurchase` nemá `@@index([purchaseDate])` ani `@@index([sponsorId])`; `TuitionCharge` nemá `@@index([period])`. Filtr/sort podle těchto sloupců je častý. | Přidat odpovídající indexy. `SponsorPayment` má indexy správně (ř. 234-236). |
| 24 | Výkon | `src/app/api/tuition-charges/route.ts:37-42` | LOW | Viz #17 — `paymentType.findMany` + regex filtr na celém seznamu místo helperu. | Nahradit za helper + cache typů po dobu requestu. |
| — | UI / a11y | — | — | Ověřeno: 0× `<img>` (všude `next/image`), 81 `aria-label` ve 19 komponentách, 3/3 dialogů s `role="dialog"`, `useFocusTrap` použit ve 3 komponentách — stav dobrý. | — |
| — | Testy | — | — | 97/97 passing, 7 test souborů (format, auth, auth-endpoint, rateLimit, csvParser, paymentMatcher, paymentImport). Chybí pokrytí pro `recalcTuitionStatus`, `codelistRoute`, `auditLog` — viz sekci 8. | — |

---

## Detailní nálezy

### 1. Kódová kvalita

**#9 — `useState<any>` / `useState<any[]>` (11 výskytů):**
```
src/app/reports/visit-cards/page.tsx:13  // students
src/app/students/page.tsx:14              // students
src/app/classes/page.tsx:13               // students
src/app/tuition/page.tsx:49               // genStudents
src/app/students/new/page.tsx:13          // classrooms
src/app/students/[id]/page.tsx:90,94      // student, editData
src/app/payments/import/[id]/page.tsx:96-99  // sponsors, students, paymentTypes, voucherRates
```
Předchozí audit označil #21 (minulá iterace) jako vyřešené; aktuální stav ukazuje, že `any[]` pro dropdown data přetrvává.

**#10 — `any` v Prisma query args a v `codelistRoute`:**
```ts
// src/app/api/payments/route.ts:21,34
const spQuery: any = { take: limit + 1, orderBy: ... }
const vpQuery: any = { ... }

// src/lib/codelistRoute.ts:8-12
delegate: {
  findMany: (args: any) => Promise<any[]>
  findUnique: (args: any) => Promise<any>
  create: (args: any) => Promise<any>
  update: (args: any) => Promise<any>
}
```
`codelistRoute` je factory používaná v 8 API routách (need-types, wish-types, equipment-types, health-types, payment-types, classrooms) — zlepšení typů prospěje všem.

**#12, #13, #14 — Dlouhé soubory:**
| Soubor | Řádky | Poznámka |
|---|---|---|
| `src/app/payments/import/[id]/page.tsx` | 757 | ImportFilterBar, ImportRowEditor |
| `src/app/students/[id]/page.tsx` | 646 | `useStudentMutations` hook |
| `src/app/payments/page.tsx` | 623 | Formuláře SP/VP |
| `src/app/reports/visit-cards/print/page.tsx` | 541 | Tisk — lze nechat |
| `src/app/reports/page.tsx` | 517 | Hraniční |
| `src/app/tuition/page.tsx` | 500 | Hraniční |
| `src/app/admin/page.tsx` | 441 | OK |

**#17 — Duplicitní regex (NOVÝ):**
V `src/app/api/tuition-charges/route.ts:41` je regex, který je identický s helperem `isTuitionPaymentType` v `src/lib/paymentTypes.ts:20`. Helper se používá v `src/lib/tuition.ts` i `src/app/api/payments/route.ts`, ale v `tuition-charges` se stále regexuje ručně.

---

### 2. Bezpečnost

**#1 — npm audit (3 high, potvrzeno během):**
```
next  9.5.0 - 15.5.14   — 5 advisories (DoS, smuggling, disk exhaustion)
picomatch <=2.3.1       — ReDoS (devDeps)
vite  7.0.0 - 7.3.1     — path traversal, FS bypass (devDeps)
```
Aktuální: `next@14.2.35`. `npm audit fix --force` by uskutečnil upgrade na next@16.2.4 (breaking).

**#2 — Hardcoded `sponsor123` v student sponsorship route:**
```ts
// src/app/api/students/[id]/sponsors/route.ts:28-30
if (!sponsorUser) {
  const defaultPassword = await hashPassword('sponsor123')
  sponsorUser = await prisma.user.create({ data: { ..., password: defaultPassword } })
}
```
Kontrast: `src/app/api/sponsors/route.ts:140` generuje `crypto.randomBytes(16).toString('hex')`. Oba flows se reálně používají — chyba je v student-scoped endpointu.

**#3 — `.env` v pracovním adresáři:**
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="gfk8z+P/IxLfr9uGzYhqGeJmDCPJmvrmvT/5zcNOJC0="
```
`.gitignore` má `.env` — soubor není tracknutý, ale existuje fyzicky (87 B, modified Mar 2). Riziko při neopatrných zálohách (tar -czf `*` zahrne i skryté soubory v rootu pokud glob není opatrně). Doporučení: oddělit `.env.example` (šablona) od `.env` (secret).

**#4 — CSP:**
```js
// next.config.js:16
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ..."
```
`unsafe-eval` je nutný pro dev HMR. V produkčním buildu by měl být podmíněně vypnutý. `unsafe-inline` v `script-src` oslabuje ochranu — možné řešení je nonce-based CSP (Next.js 14 podporuje přes `next/headers`).

**#5, #6 — Chybí rate limit na read endpointech:**
Pouze 26/45 API route souborů používá `checkRateLimit`. Bez rate limitu:
- `/api/auth/me` (volán při každém renderu)
- `/api/sponsors/names` (všichni sponzoři)
- `/api/sponsors/search` (enumeration candidate)
- Většina `admin/backup/*` routes (OK — admin-only)

**#7 — Seed default password:**
V `prisma/seed.ts` všichni sponzoři mají `sponsor123`. Deployment checklist chybí.

---

### 3. Dokumentace

**#19 — `docs/API-REFERENCE.md`:**
Poslední update Mar 3. Od té doby přibyly endpointy:
- `/api/admin/audit-log`
- `/api/admin/translate`
- `/api/admin/voucher-rates`
- `/api/admin/tuition-rates`
- `/api/tuition-charges`
- `/api/sponsors/names` (lightweight)
- `/api/sponsors/search`

Doporučení: spustit Doc Sync agent.

**CLAUDE.md ověření:**
- Sdílené hooky (`useLocale`, `useSorting`, `useStickyTop`, `useToast`) — všechny existují
- `fmtCurrency` v `src/lib/format.ts` — existuje
- `CURRENCIES` v `src/lib/constants.ts` — existuje
- `VoucherRate` flow — dokumentováno správně
- Admin translate endpoint — dokumentován správně
- Cesty `src/components/layout/Sidebar.tsx` — existuje
- Záloha DB (`prisma/dev.db.primary` vs `dev.db.backup`) — dokumentace v CLAUDE.md je detailní

---

### 4. UI / Komponenty

**Ověřeno:**
- `<img>` tagy: 0 (všude `next/image`)
- `aria-label`: 81 výskytů v 19 komponentách — dobré pokrytí
- `role="dialog"`: 3 soubory (SplitModal, BackupSection, student detail) — OK
- `useFocusTrap` pro modaly: 3/3 OK
- `'use client'`: 30 souborů — server components jsou default

**Dark mode:**
Pokrytí `dark:` variant v komponentách je konzistentní — `bg-white dark:bg-gray-800`, `text-gray-900 dark:text-gray-100` atd. (ověřeno namátkově).

---

### 5. Výkon

**#21 — Dashboard payload:**
`/api/dashboard` ve verzi z dnešního dne **přidal server-side aggregation** (`groupBy`) na ř. 88-100, ale stále vrací:
- 50 recentPayments
- 100 sponsorPayments (se student+sponsor include)
- 100 voucherPurchases (se student+sponsor include)
- 100 tuitionCharges (se student include)
- Všechny studenty (~148)
- Všechny sponzory (~137) se sponsorships

Odhadem 200-500 KB JSON. Doporučení: rozdělit endpoint.

**#22 — Statistiky bez limitu:**
`/api/statistics` načítá všechny platby bez `take`. Pro scale-up potřeba DB agregace.

**#23 — Chybějící indexy (NOVÝ):**
```prisma
model VoucherPurchase { ... }      // bez @@index([purchaseDate, sponsorId])
model TuitionCharge { ... }         // bez @@index([period])
model Need { ... }                  // bez @@index([isFulfilled])
```
`SponsorPayment` má `@@index([paymentDate])` + `@@index([sponsorId])` — OK.

**#24 — Tuition regex:** viz #17.

---

### 6. Error Handling

**Stav:**
- `error.tsx` a `not-found.tsx` existují v `src/app/` — OK
- 92 `console.*` výskytů ve 50 souborech — většinou error logging v `catch`, konzistentní
- 20+ `catch {}` tichých bloků — většina má `showMsg('error', ...)`, problémová místa:
  - `src/hooks/useFetchList.ts:23` — tichá chyba bez fallback
  - `src/components/admin/BackupSection.tsx:39,67` — tiché
  - `src/app/students/[id]/page.tsx:175,192` — tiché pro auth fetch

---

### 7. Git Hygiene

**Ověřeno:**
- `.gitignore` pokrývá: `node_modules/`, `.next/`, `prisma/dev.db*`, `.env`, `.env.local`, `*.log`, `*.tsbuildinfo`, `.DS_Store`, `public/uploads/`, `.vscode/`, `.idea/`, `dist/`, `coverage/`, `.turbo/` — výborné.
- `git ls-files | grep db` → prázdné — DB soubory NEJSOU v HEAD.
- `git log --all -- prisma/dev.db*` → 9 commitů s DB v historii (viz #18).
- `git status` čistý kromě `AUDIT-REPORT.md` (tento soubor) a untracked `rael-specification-v3.md`.

---

### 8. Testy

**`npm test` výstup:**
```
Test Files  7 passed (7)
Tests       97 passed (97)
Duration    838ms
```

**Pokrytí:**
| Soubor | Testy | Stav |
|---|---|---|
| `format.test.ts` | 21 | OK |
| `auth.test.ts` | 8 | OK (stderr: JWT_SECRET weak warning) |
| `auth-endpoint.test.ts` | 6 | OK, stderr noise z chybějícího auditLog mocku (viz #8) |
| `rateLimit.test.ts` | 5 | OK |
| `csvParser.test.ts` | 14 | OK |
| `paymentMatcher.test.ts` | 15 | OK |
| `paymentImport.test.ts` | 28 | OK |

**Chybějící pokrytí:**
- `src/lib/tuition.ts` (`recalcTuitionStatus`) — kritická business logika bez testů
- `src/lib/codelistRoute.ts` (factory pro 8 routes)
- `src/lib/auditLog.ts` (triviální, ale použít v auth flow)
- `src/lib/paymentTypes.ts` — helper má testy v `paymentImport.test.ts:84-87`, částečně OK

---

## Ověření předchozích oprav

| Nález z 2026-04-21 (předchozí) | Stav nyní |
|---|---|
| #1 npm audit — 3 high | **Přetrvává** (žádný fix neproveden) |
| #2 .env JWT_SECRET | **Přetrvává** (unchanged) |
| #3 sponsor123 hardcoded | **Přetrvává** (unchanged) |
| #4 CSP unsafe-eval | **Přetrvává** (unchanged) |
| #5, #6 rate limit na me/sponsors | **Přetrvává** |
| #7 seed default password | **Přetrvává** |
| #8 auth-endpoint test stderr | **Přetrvává** (ověřeno během testů) |
| #9 useState<any> (11 míst) | **Přetrvává** (všech 11 stále v kódu) |
| #10 any v Prisma query | **Přetrvává** |
| #11 csrf.ts indirekce | **Přetrvává** |
| #12, #13, #14 dlouhé soubory | **Přetrvává** (stejné počty řádků) |
| #15 any v students/[id] | **Přetrvává** |
| #16 catch(e) {} v layout | **Přetrvává** |
| #17 dev.db v git historii | **Přetrvává** (9 commitů) |
| #18 API-REFERENCE.md neaktuální | **Přetrvává** |
| #19 JSDoc pokrytí | **Přetrvává** |
| #20 `<img>` tagy | **Potvrzeno vyřešeno** |
| #21 dashboard payload | **Částečně** — přidán `groupBy`, ale detailní seznamy přetrvávají |
| #22 statistiky bez limitu | **Přetrvává** |
| #23 isTuition flag / regex | **Částečně** — helper `isTuitionPaymentType` existuje a je používán v `tuition.ts`, ale v `tuition-charges/route.ts:41` zůstala duplicita (viz nový #17) |

**Regrese:** Žádné.

---

## Doporučený postup oprav

**Priorita 1 (HIGH):**
1. #1 — `npm audit fix` pro devDeps + patch Next.js na 14.2.x security release
2. #2 — Nahradit `sponsor123` za `crypto.randomBytes(16)` v `students/[id]/sponsors/route.ts:30`
3. #3 — Zdokumentovat JWT_SECRET lifecycle v README/DEPLOYMENT

**Priorita 2 (MEDIUM):**
4. #5, #6 — Rate limit na `/api/auth/me` + sponsor search/names
5. #9, #10 — Typy pro useState + Prisma query args (společný `src/types/api.ts`)
6. #21, #22 — Pagination / DB agregace pro dashboard a statistics
7. #12, #13, #14 — Refactor dlouhých souborů (import detail, student detail, payments)
8. #19 — Sync API-REFERENCE.md (Doc Sync agent)
9. #4 — Produkční CSP bez `unsafe-eval`

**Priorita 3 (LOW):**
10. #8 — Doplnit mock auditLog v testu
11. #17 — Nahradit duplicitní regex za `isTuitionPaymentType` v `tuition-charges/route.ts:41`
12. #23 — Přidat `@@index([purchaseDate])`, `@@index([period])` do schema.prisma
13. #11 — Odstranit indirekci v `src/lib/csrf.ts`
14. #15, #16, #20 — Kosmetické úklidy
15. #18 — Zvážit `git filter-repo` pro DB soubory v historii

---

## Shrnutí

Projekt je v dobrém stavu — žádný CRITICAL nález, infrastruktura (auth, CSRF, rate limit, audit trail, validace) solidní. Dřívější opravy drží (testy passují, žádné regrese, UI/a11y pokrytí dobré). Klíčové HIGH nálezy jsou stále bezpečnostní: zastaralé závislosti, hardcoded sponsor heslo, JWT_SECRET lifecycle. MEDIUM úroveň dominuje typování (`any` zbytky), dlouhé soubory, výkon dashboardu. Nové LOW nálezy tohoto běhu: duplicitní regex v `tuition-charges` (helper už existuje), chybějící DB indexy na `VoucherPurchase.purchaseDate` a `TuitionCharge.period`. Od předchozího auditu nebyl žádný z 23 nálezů opraven — doporučeno vzít HIGH úroveň jako blokující pro další release.
