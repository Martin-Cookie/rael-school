# Doc Sync Agent – Synchronizace dokumentace (Rael School)

> Spouštěj po větším bloku změn, ideálně společně s CODE-GUARDIAN.
> Agent projde projekt a porovná stav kódu s dokumentací. Před implementací oprav čeká na schválení.

---

## Kontext projektu

- **Stack:** Next.js 14 (App Router), TypeScript, Prisma, SQLite, Tailwind CSS
- **Dokumentace:** `CLAUDE.md` (backend + konvence), `docs/UI_GUIDE.md` (frontend), `README.md` (instalace + přehled)
- **Klíčové cesty:** `src/app/**`, `src/lib/**`, `src/hooks/**`, `src/components/**`, `prisma/schema.prisma`

---

## Cíl

Zajistit, že `CLAUDE.md`, `docs/UI_GUIDE.md` a `README.md` přesně odpovídají aktuálnímu stavu kódu. Zastaralá dokumentace je horší než žádná.

---

## Postup

### Fáze 1: ANALÝZA (nic neměň)
Projdi projekt a porovnej realitu kódu s dokumentací. Vytvoř report rozdílů.

### Fáze 2: PLÁN OPRAV
Ukaž strukturovaný plán v chatu:
- **Smazat** (zastaralé)
- **Přidat** (chybějící)
- **Upravit** (nepřesné)

### Fáze 3: IMPLEMENTACE (až po schválení)
Po schválení proveď opravy. Commit: `docs: synchronizace dokumentace s aktuálním stavem projektu`.

---

## 1. CLAUDE.md

### 1.1 Zastaralá pravidla
Projdi každou sekci a ověř, že odpovídá kódu:
- **Zmínky o smazaných/přejmenovaných** souborech, funkcích, Prisma modelech, API routes
- **Vzory kódu** které se už nepoužívají (sdílený hook byl přejmenován, API pattern nahrazen)
- **Konfigurační hodnoty** které se změnily (výchozí VoucherRate, tuition sazby, role)
- **Moduly/endpointy** které byly odstraněny nebo přesunuty
- **Enum hodnoty** nebo statusy, které se změnily (např. TuitionStatus, PaymentImportRow status)

### 1.2 Chybějící pravidla
Projdi:
- `src/app/api/**/route.ts` (API routes)
- `prisma/schema.prisma` (modely, indexy, relace)
- `src/lib/**` (helpery, utility)
- `src/hooks/**` (sdílené hooky)
- `src/components/**` (sdílené komponenty)

Hledej vzory opakující se v kódu ale NEJSOU v CLAUDE.md:
- Nové helper funkce používané napříč moduly
- Nové konvence pojmenování
- Nové Prisma modely nebo sloupce
- Nové API route vzory (middleware, error handlers)
- Nové sdílené hooky nebo komponenty
- Specifické workaroundy (`// POZOR`, `// HACK`, `// WORKAROUND`)

Zkontroluj jestli sekce "Uživatelské role" stále odpovídá `src/lib/auth.ts` a middleware.

### 1.3 Cesty k souborům
Každý odkaz v CLAUDE.md musí existovat:
- Cesty typu `src/hooks/useLocale.ts`, `src/lib/format.ts`, `src/components/Toast.tsx` — existují?
- Odkazy na sekce UI_GUIDE.md typu `[UI_GUIDE.md § XY]` — sekce existuje?

### 1.4 Kódové příklady
- Code snippety v CLAUDE.md platné? (např. `const { message, showMsg } = useToast()` — API stále stejné?)
- Odpovídají aktuálním verzím knihoven (Next.js 14 App Router, Prisma klient)?

---

## 2. docs/UI_GUIDE.md

### 2.1 Zastaralá pravidla
- Tailwind třídy které se změnily?
- React patterns které se posunuly (např. formulář přešel z klienta na server action)?
- Komponenty (tlačítka, tabulky, modaly) — markup se vyvinul?
- Sdílené komponenty které byly smazány nebo přejmenovány?
- Ikony (lucide-react) které se změnily?

### 2.2 Chybějící vzory
Projdi `src/app/**/page.tsx` a `src/components/**` a najdi vzory které chybí v UI_GUIDE:
- Nové komponenty (karty, stepper, progress, badge, …)
- Nové layout vzory (sticky, grid, tabs)
- Nové formulářové vzory
- Nové způsoby zobrazení dat (cross-page navigace, filtry)

### 2.3 Konzistence s CLAUDE.md
- Obousměrné odkazy fungují? (CLAUDE.md → UI_GUIDE.md i zpět)
- Překrývající se sekce (např. dark mode) — říkají totéž?

### 2.4 Příklady JSX/CSS
- JSX snippety stále platné?
- Aktuální Tailwind třídy?
- Správné importy z `@/`?

---

## 3. README.md

### 3.1 Instalace a spuštění
- Kroky fungují (správné příkazy, správné pořadí)?
  - `npm install`
  - `.env` s `DATABASE_URL="file:./dev.db"`
  - `npx prisma db push`
  - `npm run db:seed`
  - `npm run dev`
- Zmíněna správná Node verze?
- Zmíněny scripts z `package.json` (`dev`, `build`, `start`, `test`, `lint`)?

### 3.2 Seznam modulů
Projdi skutečné stránky v `src/app/**/page.tsx` a sidebar v `src/components/layout/Sidebar.tsx`. Porovnej se seznamem v README:
- Chybí nové moduly?
- Jsou tam smazané moduly?
- Popsané správně (název, cesta, role přístupu)?

### 3.3 API endpointy
Projdi `src/app/api/**/route.ts` a extrahuj endpointy (GET/POST/PUT/DELETE). Porovnej se seznamem v README (pokud existuje):
- Chybějící přidej
- Smazané odstraň
- Změněné parametry/odpovědi aktualizuj

### 3.4 Přihlašovací údaje
- Odpovídají reálnému seedu v `prisma/seed.ts`?

---

## Formát reportu

Před opravami vypíš do chatu:

```markdown
## Rael School – Doc Sync Report – YYYY-MM-DD

### CLAUDE.md
**Zastaralé (smazat/upravit):**
- ř. XX: [co] — [proč zastaralé]

**Chybějící (přidat):**
- [co] — [kde v kódu se to používá]

**Nefunkční odkazy:**
- ř. XX: [odkaz] — [soubor/sekce neexistuje]

### docs/UI_GUIDE.md
**Zastaralé:**
- ...

**Chybějící:**
- ...

**Rozpory s CLAUDE.md:**
- ...

### README.md
**Zastaralé:**
- ...

**Chybějící moduly:**
- ...

**Chybějící endpointy:**
- ...

### Souhrn
- Celkem změn: X
- CLAUDE.md: X úprav
- UI_GUIDE.md: X úprav
- README.md: X úprav
```

Po schválení oprav commit:
`docs: synchronizace dokumentace s aktuálním stavem projektu`

---

## Spuštění

```
Přečti docs/agents/DOC-SYNC.md a proveď synchronizaci dokumentace. Nejdřív analyzuj a ukaž report, pak po schválení oprav dokumenty.
```
