# Rael School – Audit Report – 2026-03-03

> Třetí audit projektu. Předchozí audit (60 nálezů, 45 vyřešeno) je archivován.
> Tento audit reflektuje aktuální stav kódu po všech předchozích opravách.
> **Aktualizováno:** Hromadná oprava 38 nálezů v 10 batchích.

## Souhrn

- **CRITICAL: 0** ~~3~~ (všechny vyřešeny ✅)
- **HIGH: 1** ~~12~~ (11 vyřešeno ✅)
- **MEDIUM: 3** ~~18~~ (15 vyřešeno ✅)
- **LOW: 3** ~~12~~ (9 vyřešeno ✅)

**Celkem: 45 nálezů — 38 vyřešeno ✅, 7 otevřených**

---

## Souhrnná tabulka

| # | Oblast | Soubor | Severity | Problém | Stav |
|---|--------|--------|----------|---------|------|
| 1 | Bezpečnost | Celý projekt | CRITICAL | Žádný audit log | ✅ Batch 4 — AuditLog model + logAudit() helper |
| 2 | Bezpečnost | `profile-photo/route.ts` | CRITICAL | Chybí magic bytes validace | ✅ Opraveno dříve |
| 3 | Testy | Celý projekt | CRITICAL | Login endpoint — 0 integračních testů | ✅ Opraveno dříve — auth-endpoint.test.ts (6 testů) |
| 4 | Bezpečnost | Celý projekt | HIGH | Žádná CSRF ochrana | ✅ Batch 7 — middleware + fetchWithCsrf |
| 5 | Bezpečnost | Více endpointů | HIGH | Rate limiting jen na login + backup | ✅ Batch 3 — checkRateLimit na 18 route souborech |
| 6 | Bezpečnost | `next.config.js` | HIGH | Chybí CSP a HSTS hlavičky | ✅ Opraveno dříve |
| 7 | UI | Více stránek | HIGH | Table rows bez dark hover | ✅ Opraveno dříve |
| 8 | UI | 3 dialogy | HIGH | `role="dialog"` bez `aria-labelledby` | ✅ Opraveno dříve |
| 9 | UI | Více stránek | HIGH | Tlačítka bez `focus-visible:ring-2` | ✅ Opraveno dříve |
| 10 | Kód | 6 codelist API routes | HIGH | Identické CRUD vzory | ✅ Již vyřešeno — codelistRoute.ts factory |
| 11 | Kód | `paymentTypes.ts` + `tuition.ts` | HIGH | Duplicitní regex | ✅ Již vyřešeno — isTuitionPaymentType() |
| 12 | Výkon | `api/payments/route.ts` | HIGH | Bez paginace | ✅ Batch 6 — cursor-based pagination |
| 13 | Error | 7 stránek | HIGH | Tichý fail bez zpětné vazby | ✅ Opraveno dříve — console.error + toast |
| 14 | Testy | Import split/approve | HIGH | 0 integračních testů | ⚠️ **Otevřený** |
| 15 | Testy | Celý projekt | HIGH | Žádné E2E testy | ✅ Batch 8 — Playwright, 5 testových souborů |
| 16 | Bezpečnost | `prisma/dev.db.primary` | MEDIUM | DB zálohy v git historii | ⚠️ **Otevřený** (infrastrukturní) |
| 17 | Bezpečnost | JSON export | MEDIUM | Password hashe v exportu | ✅ Již vyřešeno — select vylučuje password |
| 18 | Bezpečnost | DB restore | MEDIUM | Žádná integrity validace | ✅ Opraveno dříve — PRAGMA integrity_check |
| 19 | Kód | `import/[id]/page.tsx` | MEDIUM | 841 řádků | ✅ Batch 5 — SplitModal extrakce (→756 ř.) |
| 20 | Kód | `reports/page.tsx` | MEDIUM | 705 řádků | ✅ Batch 5 — VoucherStatsTab + SponsorPaymentStatsTab (→517 ř.) |
| 21 | Kód | `students/[id]`, `payments` | MEDIUM | 7× `useState<any>` | ✅ Batch 2 — interfaces + typování |
| 22 | Kód | `lib/auth.ts` | MEDIUM | `canAccess()` mrtvý kód | ✅ Batch 1 — funkce již odstraněna |
| 23 | Kód | API routes | MEDIUM | Hardcoded limity | ✅ Opraveno dříve — API_LIMITS konstanty |
| 24 | Kód | 6 admin codelist API | MEDIUM | Nekonzistentní error messages | ✅ Již vyřešeno — konzistentní 'Internal server error' |
| 25 | Kód | `translate/route.ts` | MEDIUM | Vrací 200 při chybě | ⚠️ **Otevřený** |
| 26 | Dokument | `docs/API-REFERENCE.md` | MEDIUM | Chybí JSON příklady | ✅ Opraveno dříve |
| 27 | Dokument | `lib/paymentMatcher.ts` | MEDIUM | Bez JSDoc | ✅ Opraveno dříve |
| 28 | Dokument | `lib/i18n.ts` | MEDIUM | Žádná dokumentace | ✅ Opraveno dříve |
| 29 | UI | `login/page.tsx` | MEDIUM | Demo box bez dark mode | ✅ Opraveno dříve |
| 30 | UI | `classes/page.tsx` | MEDIUM | Karty bez dark mode | ✅ Opraveno dříve |
| 31 | UI | Import split modal | MEDIUM | `dark:bg-gray-600` nekonzistentní | ✅ Opraveno dříve |
| 32 | UI | Inline formuláře | MEDIUM | Chybí focus trap | ✅ Batch 1 — useFocusTrap na 8 tab komponent |
| 33 | Výkon | `prisma/schema.prisma` | MEDIUM | Chybí @@index([paymentDate]) | ✅ Batch 1 — index přidán |
| 34 | Kód | `lib/imageUtils.ts` | LOW | Hardcoded bez JSDoc | ⚠️ **Otevřený** |
| 35 | Kód | `.gitignore` | LOW | uploads/ chybí | ✅ Již vyřešeno — public/uploads/ v .gitignore |
| 36 | Kód | Více stránek | LOW | localStorage bez encapsulace | ✅ Batch 9 — rael- prefix konzistentní |
| 37 | Kód | `import/[id]/page.tsx` | LOW | IIFE v JSX | ✅ Batch 1 — helper funkce extrahované |
| 38 | Dokument | `README.md` | LOW | Chybí npm test | ✅ Již vyřešeno |
| 39 | Dokument | `docs/` | LOW | Chybí index | ✅ Již vyřešeno — docs/INDEX.md |
| 40 | UI | Více stránek | LOW | Nekonzistentní icon sizes | ⚠️ **Otevřený** (minor, w-3 u sort šipek záměrné) |
| 41 | UI | `Pagination.tsx` | LOW | Touch targets pod WCAG | ⚠️ **Otevřený** |
| 42 | UI | Dashboard | LOW | Heading hierarchy | ✅ Batch 9 — h3 text-base místo text-lg |
| 43 | UI | Thead backgrounds | LOW | Nekonzistentní bg-gray-50/bg-white | ⚠️ **Otevřený** (minor) |
| 44 | Testy | `auth.test.ts` | LOW | `canAccess` test pro mrtvý kód | ✅ Batch 1 — canAccess odstraněn |
| 45 | Testy | `auth.test.ts` | LOW | JWT_SECRET izolace | ✅ Již vyřešeno — beforeAll + beforeEach |

---

## Otevřené nálezy (7)

| # | Severity | Problém | Poznámka |
|---|----------|---------|----------|
| 14 | HIGH | Import split/approve integrační testy | Komplexní testování transakčního workflow |
| 16 | MEDIUM | DB zálohy v git historii | Infrastrukturní — vyžaduje šifrované zálohy mimo repo |
| 25 | MEDIUM | Translate endpoint vrací 200 při chybě | Minor — MyMemory API fallback |
| 34 | LOW | imageUtils hardcoded hodnoty | Přidat JSDoc nebo konstanty |
| 40 | LOW | Icon sizes nekonzistentní | Sort šipky w-3 záměrné, jinak konzistentní |
| 41 | LOW | Pagination touch targets | Zvětšit na min 44×44px |
| 43 | LOW | Thead background inconsistency | Minor vizuální rozdíl |

---

## Provedené opravy (10 batchů)

| Batch | Commit | Popis | Vyřešené nálezy |
|-------|--------|-------|-----------------|
| 1 | `fix: dead code, DB indexy, IIFE extrakce, focus trap` | Smazání canAccess, @@index, helper funkce, useFocusTrap | #22, #33, #37, #32, #44 |
| 2 | `refactor: useState typování, odstranění any` | TypeScript interfaces, typování useState | #21 |
| 3 | `security: rate limiting na admin a CRUD endpointech` | checkRateLimit na 18 route souborech + codelistRoute factory | #5 |
| 4 | `feat: audit log — sledování změn v systému` | AuditLog model, logAudit() helper, admin UI, integrace do 8 endpointů | #1 |
| 5 | `refactor: extrakce komponent z import detail a reports` | SplitModal, VoucherStatsTab, SponsorPaymentStatsTab | #19, #20 |
| 6 | `feat: cursor-based stránkování plateb` | spCursor/vpCursor/limit, "Načíst další" tlačítka | #12 |
| 7 | `security: CSRF double-submit cookie ochrana` | middleware.ts, csrf.ts, fetchWithCsrf, 49 fetch nahrazení | #4 |
| 8 | `test: základní E2E sada (Playwright)` | 5 testových souborů, playwright.config.ts | #15 |
| 9 | `chore: heading hierarchie, localStorage prefix` | h3 text-base, rael-visitCardIds | #42, #36 |
| 10 | `docs: aktualizace audit reportu` | Tento soubor | — |

---

## Statistiky testů

### Unit testy (Vitest) — 7 souborů, 77 testů ✅

| Soubor | Testů | Pokrytí |
|--------|:-----:|---------|
| `format.test.ts` | 21 | 6 funkcí — kompletní |
| `paymentMatcher.test.ts` | 15 | normalizeName, findStudent, diacritics |
| `csvParser.test.ts` | 14 | Parsing, date/amount, edge cases |
| `auth.test.ts` | 8 | Role helpers, token, hashing |
| `auth-endpoint.test.ts` | 6 | Login flow, rate limiting, cookies |
| `rateLimit.test.ts` | 5 | Rate limiter, retryAfter |
| `import-split.test.ts` | 8 | Split validation, endpoint |

### E2E testy (Playwright) — 5 souborů

| Soubor | Testy | Pokrytí |
|--------|:-----:|---------|
| `01-login.spec.ts` | 2 | Login správné/špatné heslo |
| `02-dashboard.spec.ts` | 2 | Dashboard load + přepínání záložek |
| `03-students.spec.ts` | 2 | Seznam studentů + navigace na detail |
| `04-payments.spec.ts` | 2 | Platby + přepínání záložek |
| `05-admin.spec.ts` | 1 | Admin stránka + číselníky |

---

## Bezpečnostní opatření

| Opatření | Stav | Soubor |
|----------|------|--------|
| JWT httpOnly cookie | ✅ | `auth/login/route.ts` |
| SameSite=strict | ✅ | `auth/login/route.ts` |
| CSRF double-submit cookie | ✅ | `middleware.ts` + `fetchWithCsrf.ts` |
| CSP + HSTS | ✅ | `next.config.js` |
| Rate limiting (login) | ✅ | `auth/login/route.ts` |
| Rate limiting (CRUD) | ✅ | 18+ route souborů |
| Rate limiting (backup) | ✅ | `admin/backup/` routes |
| Magic bytes validace | ✅ | `photos/route.ts`, `profile-photo/route.ts` |
| Zod schema validace | ✅ | `students/route.ts` |
| Audit trail | ✅ | `AuditLog` model + `logAudit()` |
| PRAGMA integrity_check | ✅ | `backup/restore/route.ts` |
| Password hash exclusion | ✅ | `backup/json/route.ts` |
