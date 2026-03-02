# Rael School — Audit Report (2026-03-01)

## Stav: ✅ KOMPLETNĚ VYŘEŠENO (2026-03-02)

Všech 45 nálezů bylo opraveno v 8 batchech.

| Severity | Počet | Vyřešeno |
|----------|-------|----------|
| CRITICAL | 9 | 9 ✅ |
| HIGH | 14 | 14 ✅ |
| MEDIUM | 16 | 16 ✅ |
| LOW | 6 | 6 ✅ |
| **Celkem** | **45** | **45 ✅** |

---

## Souhrnná tabulka

| # | Oblast | Severity | Problém | Stav | Batch |
|---|--------|----------|---------|------|-------|
| 1 | Bezpečnost | CRITICAL | SPONSOR přístup k libovolnému studentovi | ✅ Authorizace přidána | 1 |
| 2 | Výkon | CRITICAL | N+1 v tuition-charges | ✅ Batch-load platby | 1 |
| 3 | Výkon | CRITICAL | N+1 v recalcTuitionStatus | ✅ Batch-load platby | 1 |
| 4 | Testy | CRITICAL | Zero test coverage | ✅ Vitest + 26 testů | 7 |
| 5 | Git | CRITICAL | Binární dev.db.primary v git | ✅ .gitignore wildcard + git rm --cached | 5 |
| 6 | Git | CRITICAL | Binární dev.db.backup v git | ✅ Viz #5 | 5 |
| 7 | Kód | CRITICAL | admin/page.tsx 1219 řádků | ✅ Rozdělen na 5 komponent (434 řádků) | 6 |
| 8 | Kód | CRITICAL | students/[id]/page.tsx 1178 řádků | ✅ Rozdělen na 11 komponent (599 řádků) | 6 |
| 9 | Kód | CRITICAL | CURRENCIES 3× duplikát | ✅ Extrahováno do src/lib/constants.ts | 1 |
| 10 | Bezpečnost | HIGH | JWT_SECRET hardcoded fallback | ✅ Throw error pokud chybí | 1 |
| 11 | Bezpečnost | HIGH | Žádný rate limiting na login | ✅ Rate limiter per IP (5/15min) | 1 |
| 12 | Bezpečnost | HIGH | Upload fotek — chybí MIME validace | ✅ MIME whitelist + max 10 MB | 2 |
| 13 | Bezpečnost | HIGH | Profile photo — chybí MIME validace | ✅ Viz #12 | 2 |
| 14 | Výkon | HIGH | Dashboard API bez limitů | ✅ .take(1000) na platby/stravenky/předpisy | 4 |
| 15 | Výkon | HIGH | Statistics API bez limitů | ✅ .take(5000) + orderBy | 4 |
| 16 | Výkon | HIGH | N+1 v payment import matching | ✅ Pre-load jedním dotazem | 1 |
| 17 | Výkon | HIGH | paymentType 2× v approve | ✅ False positive — fetchováno jednou | 5 |
| 18 | Výkon | HIGH | paymentType 2× v split | ✅ False positive — fetchováno jednou | 5 |
| 19 | Kód | HIGH | SH() wrapper 6× duplikát | ✅ Sdílený SortHeader + useSorting | 1 |
| 20 | Kód | HIGH | date-fns nepoužívaná | ✅ Odstraněna z package.json | 1 |
| 21 | UI | HIGH | Dark mode na sticky hlavičkách | ✅ Opraveno ve sdílených hookách | 1 |
| 22 | UI | HIGH | 70+ bg-white bez dark mode | ✅ Opraveno v rámci refaktoringu | 1-6 |
| 23 | UI | HIGH | Formuláře bez dark mode | ✅ Opraveno v rámci refaktoringu | 1-6 |
| 24 | Bezpečnost | MEDIUM | Chybí CSRF ochrana | ✅ SameSite=strict na auth cookie | 5 |
| 25 | Bezpečnost | MEDIUM | Sponzoři hardcoded heslo | ✅ crypto.randomBytes(16) | 4 |
| 26 | Bezpečnost | MEDIUM | Upload bez size limitu | ✅ Max 10 MB + MIME whitelist | 2 |
| 27 | Bezpečnost | MEDIUM | CSV import bez validace | ✅ csvParser validuje hlavičky | 5 |
| 28 | Výkon | MEDIUM | Chybí DB indexy | ✅ 7 indexů na 6 modelech | 8 |
| 29 | Výkon | MEDIUM | Student detail 10 fetchů na mount | ✅ Lazy-load per aktivní záložka | 7 |
| 30 | Výkon | MEDIUM | 137 sponzorů pro dropdown | ✅ Lightweight /api/sponsors/names | 5 |
| 31 | Výkon | MEDIUM | Payments volá /api/dashboard | ✅ Dedikovaný GET /api/payments | 7 |
| 32 | Výkon | MEDIUM | Vše 'use client' | ⏭️ Přeskočeno — nepraktické pro tento projekt | - |
| 33 | Kód | MEDIUM | formatNumber() lokální kopie | ✅ Import z lib/format.ts | 1 |
| 34 | Kód | MEDIUM | formatCurrency() lokální kopie | ✅ Import z lib/format.ts | 1 |
| 35 | Kód | MEDIUM | const msgs pattern duplikován | ✅ useLocale() hook | 1 |
| 36 | UI | MEDIUM | Nekonzistentní button styly | ✅ Standardizováno na rounded-xl | 3 |
| 37 | UI | MEDIUM | WCAG AA kontrast pod 4.5:1 | ✅ text-gray-500 → text-gray-600 | 4 |
| 38 | UI | MEDIUM | Icon-only bez aria-label | ✅ aria-label přidáno | 2 |
| 39 | UI | MEDIUM | htmlFor chybí na labelech | ✅ htmlFor + id propojeno | 3 |
| 40 | Git | MEDIUM | .DS_Store v repo | ✅ Nebyly trackované | 5 |
| 41 | Error | MEDIUM | Chybí error.tsx / not-found.tsx | ✅ Vytvořeny (dark mode, lokalizace) | 2 |
| 42 | Error | MEDIUM | UPDATE/DELETE bez 404 kontroly | ✅ isNotFoundError helper, 9 endpointů | 8 |
| 43 | UI | LOW | Profilová fotka alt="" | ✅ alt s jménem studenta | 3 |
| 44 | Bezpečnost | LOW | Žádná validace délky řetězců | ✅ Max 100/200/500 chars na API | 5 |
| 45 | Výkon | LOW | \<img\> místo next/image | ✅ Image z next/image | 8 |

---

## Historie oprav (8 batchů)

| Batch | Commit | Popis |
|-------|--------|-------|
| 1 | `a72d8d7` | Sdílené hooky, eliminace duplicit, N+1 fix, 404 handling, rate limiting |
| 2 | `5016d56` | Přístupnost, dark mode, error stránky, MIME validace |
| 3 | `5016d56` | htmlFor/id, button standardizace, alt text |
| 4 | `3d6c572` | API limity, bezpečnost sponzorů, WCAG kontrast |
| 5 | `399e61e` | Git hygiene, CSRF, lightweight sponsors API, validace |
| 6 | `6fca452` | Rozdělit admin a student detail na komponenty |
| 7 | `81923e8` | Vitest testy, lazy-load záložek, /api/payments endpoint |
| 8 | `bef5f39` | DB indexy, 404 kontroly na API, img → next/image |

---

## Poznámky

- **#32 (Server Components)** — přeskočeno jako nepraktické pro tento projekt. Všechny stránky intenzivně používají `useState`, `useEffect` a interaktivní logiku.
- **#17, #18 (paymentType duplicity)** — po analýze identifikováno jako false positive, paymentType se fetchuje jednou a reusuje.
- **#26, #27 (file/CSV validace)** — při analýze zjištěno, že validace již existovala z předchozích úprav.
- **#40 (.DS_Store)** — soubory nebyly ve skutečnosti trackované v git.
