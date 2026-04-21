# Code Guardian – Audit kódu, bezpečnosti a kvality (Rael School)

> Spouštěj po větším bloku změn, před releasem, nebo periodicky (např. měsíčně).
> Výstup: `AUDIT-REPORT.md` v rootu projektu.

---

## Kontext projektu

- **Stack:** Next.js 14 (App Router), TypeScript, Prisma, SQLite, Tailwind CSS
- **Adresářová struktura:** `src/app/**` (stránky + API routes), `src/lib/**` (helpery), `src/hooks/**`, `src/components/**`, `prisma/schema.prisma`
- **Konvence:** viz `CLAUDE.md` (backend pravidla) a `docs/UI_GUIDE.md` (frontend konvence)
- **Role:** ADMIN, MANAGER, SPONSOR, VOLUNTEER (viz CLAUDE.md § Uživatelské role)

---

## Cíl

Projdi celý projekt a vytvoř **audit report** pokrývající 8 oblastí: kód, bezpečnost, dokumentace, UI/komponenty, výkon, error handling, git hygiene, testy. Výstup ulož do `AUDIT-REPORT.md`.

---

## Instrukce

**NEPRAV ŽÁDNÝ KÓD. POUZE ANALYZUJ A REPORTUJ.**

U každého nálezu uveď:
- **Soubor:řádek**
- **Severity:** CRITICAL / HIGH / MEDIUM / LOW
- **Popis** problému
- **Doporučení** k opravě

Před začátkem si přečti starý `AUDIT-REPORT.md` (pokud existuje) — vyřešené nálezy neopakuj, ale ověř, že opravy stále drží.

---

## 1. KÓDOVÁ KVALITA

### 1.1 Duplikáty a mrtvý kód
- Duplicitní komponenty / helper funkce (copy-paste mezi moduly)
- Nepoužívané exporty, importy, funkce, proměnné
- Zakomentovaný kód zbylý po debugování
- `TODO` / `FIXME` / `HACK` / `XXX` komentáře

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx"
npx knip 2>&1 | head -50
```

### 1.2 Konzistence pojmenování
- **Funkce a proměnné:** camelCase (TS konvence), ne snake_case
- **Komponenty:** PascalCase (`StudentCard`, ne `student_card`)
- **Props:** camelCase bez prefixu (`onClick`, ne `handleOnClick`)
- **API routes:** RESTful konvence (`/api/students`, `/api/students/[id]`)
- **DB modely (Prisma):** PascalCase, sloupce camelCase
- **Locale klíče:** tečková notace (`nav.students`, `payments.addNew`)

### 1.3 Importy a závislosti
- Nepoužívané importy v `.ts` / `.tsx`
- Chybějící nebo duplicitní v `package.json`
- Import z `@/lib/*` vs relativní cesty — konzistentní?

### 1.4 Struktura kódu
- Komponenty >300 řádků — kandidáti na rozdělení
- Funkce >50 řádků — kandidáti na extract
- Soubory stránek (`page.tsx`) >500 řádků — business logiku vyčlenit do hooků/utilů
- Hardcoded hodnoty které patří do `src/lib/constants.ts` nebo číselníků
- Opakující se vzory → sdílený hook (viz `useLocale`, `useSorting`, `useStickyTop`, `useToast` v CLAUDE.md § UI vzory)

### 1.5 TypeScript zdraví
- `any` typy — kde jsou a proč?
- `@ts-ignore` / `@ts-expect-error` bez vysvětlení
- Chybějící návratové typy u exportovaných funkcí
- `as unknown as Type` casty — jsou nutné?
- Prisma query argumenty jako `any`

---

## 2. BEZPEČNOST

### 2.1 Autentizace a autorizace
- Každý API endpoint v `src/app/api/**/route.ts` volá `getCurrentUser()` (kromě public: login, health)?
- Role check odpovídá citlivosti operace? (admin-only endpointy mají check?)
- JWT cookie flags: `httpOnly`, `secure` (v produkci), `sameSite`

### 2.2 Vstupní data
- **SQL injection:** Prisma chrání parametrizací, ale `$queryRaw` / `$executeRaw` bez template literal jsou riziko
- **XSS:** raw HTML injection props (např. React `dangerously*InnerHTML`) — kde jsou a proč?
- **CSRF:** POST/PUT/DELETE endpointy mají CSRF check (viz `src/lib/csrf.ts`)
- **File upload:** magic bytes validace (fotografie), limit velikosti, whitelist MIME
- **Rate limiting:** kritické endpointy (login, export, import) mají `checkRateLimit`?

### 2.3 Citlivá data
- Hesla v plaintextu v kódu (kromě seed dat)
- Hardcoded predikovatelná hesla v produkčním kódu (`sponsor123` apod.)
- API klíče, JWT secrets v kódu
- `.env` v `.gitignore` a NENÍ v repo (git history)
- `console.log` s citlivými daty
- Error responses neleakují interní info (stack trace, cesty)

### 2.4 Závislosti
```bash
npm audit
```
- Zranitelné balíčky v `dependencies` vs `devDependencies`?
- Zastaralé major verze s CVEs (Next.js, Prisma, React)?

### 2.5 Headers a CSP
- `next.config.js` má CSP, HSTS, X-Frame-Options, X-Content-Type-Options?
- `strict-transport-security` v produkci?

---

## 3. DOKUMENTACE

### 3.1 CLAUDE.md
- Každá sekce odpovídá realitě?
- Zmínky o smazaných/přejmenovaných souborech/funkcích/modelech/routes?
- Zastaralé vzory (popisuje hook který už neexistuje)?
- Chybí důležitá nová pravidla?
- Cesty k souborům (`src/hooks/useLocale.ts`, `src/lib/format.ts`) — existují?

### 3.2 docs/UI_GUIDE.md
- UI vzory stále aktuální? (layout, formuláře, sticky headers, dark mode)
- Tailwind třídy v příkladech odpovídají aktuálnímu kódu?
- Odkazy CLAUDE.md ↔ UI_GUIDE.md obousměrné a platné?

### 3.3 README.md
- Instalační kroky funkční? (`npm install`, `npx prisma db push`, `npm run db:seed`, `npm run dev`)
- Správná Node verze?
- Seznam modulů v README odpovídá sidebaru v `src/components/layout/Sidebar.tsx`?

### 3.4 Komentáře v kódu
- Komplexní business logika bez komentářů (tuition status, voucher count, payment matching)
- Zastaralé komentáře (popis neodpovídá kódu)
- Magické hodnoty bez vysvětlení (proč `80` pro voucher rate? proč `3700`/`4700` tuition?)
- JSDoc u exportovaných funkcí z `src/lib/`

---

## 4. UI / KOMPONENTY

### 4.1 Konzistence komponent
- Tlačítka, tabulky, formuláře — stejné Tailwind třídy napříč stránkami?
- Sdílené hooky (`useLocale`, `useSorting`, `useStickyTop`, `useToast`) — všude kde mají být?
- Sdílené komponenty (`<SortHeader>`, `<Toast>`) — všude kde mají být?
- Ikony z `lucide-react`, konzistentní velikosti (`h-4 w-4`, `h-5 w-5`)?
- Toast notifikace přes `useToast()` (ne vlastní implementace)?

### 4.2 React patterns
- `'use client'` jen kde nutné (server components jsou default)?
- Formuláře přes Server Actions nebo API routes — konzistentně?
- `useEffect` dependencies — úplné?
- Klíče v `.map()` — unikátní a stabilní?
- Memoizace (`useMemo`, `useCallback`) — nadměrná nebo chybějící?

### 4.3 Responsive design
- Sidebar skrytí na mobilu (`lg:` prefix)?
- Tabulky: horizontální scroll nebo stack na mobilu?
- Touch targets min 44×44 px?
- Sticky hlavičky fungují na mobilu i desktopu (viz CLAUDE.md § Sticky layout)?

### 4.4 Přístupnost (WCAG AA)
- `<label>` nebo `aria-label` na inputech
- `alt` na obrázcích (`next/image` i `<img>`)
- Kontrast min 4.5:1 (light i dark)
- `focus-visible:ring-*` na interaktivních prvcích
- Heading hierarchie (h1 → h2 → h3, bez přeskakování)
- Dialogy: `role="dialog"` + `aria-labelledby`
- Error messages propojené s inputy (`aria-describedby`)

### 4.5 Dark mode
- Každá nová komponenta má `dark:` varianty (viz CLAUDE.md § Dark mode)?
- Kontrast v dark módu dostatečný?

### 4.6 Lokalizace
- Každý UI text má klíč ve VŠECH třech jazycích (cs, en, sw)?
- Chybějící překlady (klíč bez hodnoty → zobrazí se klíč místo textu)
- `fmtCurrency()` použitý všude pro částky?

---

## 5. VÝKON

### 5.1 Prisma dotazy
- N+1 problém — `include`/`select` místo dotazu v cyklu?
- Chybějící indexy v `schema.prisma` na sloupcích často filtrovaných/řazených?
- `findMany()` bez `take` — může vrátit desítky tisíc záznamů?
- `include: { _count }` kde se dá vyhnout samostatnému count dotazu?

### 5.2 API routes
- Paralelizace nezávislých DB dotazů přes `Promise.all`?
- Caching statických dat (číselníky, sazby)?
- Response size — vrací se jen co potřeba?

### 5.3 Client-side
- Zbytečné re-rendery (chybějící `memo` / špatné deps)?
- Velké bundle — `next/dynamic` pro velké komponenty?
- Obrázky přes `next/image`?

---

## 6. ERROR HANDLING

### 6.1 TypeScript
- Holý `catch` bez logování (polknutá chyba)?
- `try/catch` u rizikových operací (DB, parsing, fetch)?
- Error boundaries (`error.tsx` v App Routeru)?
- Konzistentní error response napříč API routes?

### 6.2 HTTP chyby
- `not-found.tsx` a `error.tsx` v rootu App Routeru?
- API routes vrací konzistentní `{ error: string, code?: string }`?
- Error flash messages srozumitelné uživateli (ne stack trace)?

### 6.3 Formuláře
- Validace na serveru (ne jen client-side)?
- Zachování vyplněných dat při chybě?
- Lokalizované chybové hlášky?

---

## 7. GIT HYGIENE

### 7.1 Soubory v repo
- `.gitignore`: `node_modules/`, `.next/`, `*.tsbuildinfo`, `.env`, `prisma/dev.db` (ne `dev.db.primary`!), `.DS_Store`
- Velké binární soubory v historii (>1 MB)?
- Citlivá data v git historii (hesla, klíče)?
- `prisma/dev.db.primary` je trackovaný — ZÁMĚRNĚ (hlavní záloha)

### 7.2 Commit kvalita
- Srozumitelné messages (česky dle CLAUDE.md)?
- Commity nemíchají nesouvisející změny?

---

## 8. TESTY

### 8.1 Pokrytí
Kritické flows mají testy?
- Login / auth
- Import bank výpisů (approve / split / reject)
- `recalcTuitionStatus` (tuition status business logika)
- Voucher count z amount (podle VoucherRate)
- CSV export

```bash
npm test 2>&1 | tail -20
```

### 8.2 Kvalita testů
- Zastaralé testy (testují neexistující funkce)?
- Testy bez smysluplného assertu (vždy projdou)?
- Hardcoded data závislá na stavu DB?
- Cleanup po testech?

### 8.3 E2E (TEST-AGENT)
Pro komplexní E2E testování UI je dedikovaný `TEST-AGENT.md` (Playwright MCP). Code Guardian je primárně statická analýza — E2E delegovat na Test Agent.

---

## Formát výstupu

Vytvoř `AUDIT-REPORT.md` v rootu s tímto formátem:

```markdown
# Rael School – Audit Report – YYYY-MM-DD

> Audit projektu. Předchozí audit (pokud byl) je zhodnocen a vyřešené nálezy ověřeny.

## Souhrn

- CRITICAL: X
- HIGH: X
- MEDIUM: X
- LOW: X

**Celkem: X nálezů**

## Souhrnná tabulka

| # | Oblast | Soubor | Severity | Problém | Doporučení |
|---|--------|--------|----------|---------|------------|
| 1 | Bezpečnost | `src/app/api/xyz/route.ts:45` | CRITICAL | ... | ... |

## Detailní nálezy

### 1. Kódová kvalita
...

### 2. Bezpečnost
...

### 3. Dokumentace
...

### 4. UI / Komponenty
...

### 5. Výkon
...

### 6. Error Handling
...

### 7. Git Hygiene
...

### 8. Testy
...

## Ověření předchozích oprav
Projdi starý AUDIT-REPORT.md a ověř, že vyřešené nálezy drží. Regrese → nový nález.

## Doporučený postup oprav
1. Nejdřív CRITICAL
2. Pak HIGH (zejména bezpečnost)
3. MEDIUM a LOW do dalších iterací
```

---

## Spuštění

```
Přečti docs/agents/CODE-GUARDIAN.md a proveď kompletní audit projektu. Výstupem je AUDIT-REPORT.md v rootu. Nic neopravuj, pouze reportuj.
```
