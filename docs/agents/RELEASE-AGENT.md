# Release Agent – Příprava verze (Rael School)

> Spouštěj před vydáním nové verze.
> Agent ověří připravenost, aktualizuje CHANGELOG a připraví release tag.

---

## Kontext projektu

- **Stack:** Next.js 14 + TypeScript + Prisma + SQLite
- **Verze:** Semver (major.minor.patch)
- **Tag formát:** `vX.Y.Z`
- **Hlavní větev:** `main`

---

## Cíl

Ověřit, že aplikace je v konzistentním stavu, vytvořit/aktualizovat CHANGELOG.md a připravit release tag.

---

## Fáze 1: PRE-RELEASE KONTROLA (nic neměň)

### 1.1 Kód
- `npm run build` — projde bez chyb
- `npm run lint` — žádné errors (warnings OK)
- `npm test` — všechny testy projdou
- Žádné `TODO` / `FIXME` / `HACK` blokující release
- Žádné debug hodnoty (`console.log`, testovací hesla/emaily mimo seed)
- `package.json` je v pořádku (verze, scripts, deps)

### 1.2 Databáze
- Prisma schema odpovídá DB: `npx prisma db push --skip-generate` bez změn
- Seed funguje na čisté DB (test v `/tmp`):
  ```bash
  cd /tmp && mkdir -p rael-release-test && cd rael-release-test
  cp -r /Users/martinkoci/Projects/rael-school/. .
  rm prisma/dev.db
  echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
  npm install
  npx prisma db push && npm run db:seed
  ```
- `prisma/dev.db.primary` je aktuální (obsahuje poslední runtime data)
- `prisma/dev.db.backup` je funkční (demo data)

### 1.3 Soubory
- `.gitignore` kompletní: `node_modules/`, `.next/`, `.env`, `prisma/dev.db`, `.DS_Store`, `*.tsbuildinfo`
- `.env` NENÍ v repozitáři (ani v historii)
- `data/students-real.json` a `data/config-real.json` aktuální
- Žádné citlivé údaje v kódu ani v git historii

### 1.4 Dokumentace
- `README.md` aktuální (instalace, spuštění, moduly)
- `CLAUDE.md` odpovídá realitě
- `docs/UI_GUIDE.md` odpovídá realitě
- (Spustit DOC-SYNC agent pokud jsou pochybnosti)

### 1.5 Funkčnost (Playwright MCP doporučen)

```
mcp__playwright__browser_navigate("http://localhost:3000/login")
# login jako admin → procházet sidebar — každou stránku navigate + snapshot
```

Projdi každou stránku v sidebaru:
- `/dashboard`
- `/students` + `/students/[id]`
- `/sponsors`
- `/payments` (taby: sponzorské, stravenky)
- `/tuition`
- `/classes`
- `/reports/visit-cards`
- `/admin`

Role check:
- Přihlášení funguje pro všechny role (admin, manager, sponsor, volunteer)
- Dashboard: stat karty viditelné
- CRUD (přidání, editace, smazání studenta)
- Import bankovních výpisů
- CSV export
- Tisk visit cards
- Dark mode na všech stránkách
- Lokalizace (přepnutí cs/en/sw — všechny klíče mají překlady)

### 1.6 Bezpečnost
- Pokud od posledního CODE-GUARDIAN auditu uplynul >1 měsíc, spusť ho
- `npm audit` — žádné HIGH/CRITICAL v `dependencies` (devDeps OK)
- JWT_SECRET v `.env` není default

---

## Fáze 2: CHANGELOG

### 2.1 Získat změny od posledního tagu
```bash
git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~50)..HEAD
```

### 2.2 Aktualizovat `CHANGELOG.md`

Pokud neexistuje, vytvoř. Formát:

```markdown
## [X.Y.Z] – YYYY-MM-DD

### Nové funkce
- [popis viditelný pro uživatele]

### Opravy
- [popis opravených chyb]

### Změny
- [změny chování, UI úpravy]

### Bezpečnost
- [bezpečnostní opravy — zvláštní sekce]

### Technické
- [migrace, závislosti, interní změny]

### Breaking changes (pokud jsou)
- [co se změnilo tak, že vyžaduje akci uživatele / admina]
```

### 2.3 Verzování
- **Major** (X.0.0) — breaking changes
- **Minor** (0.Y.0) — nové funkce zpětně kompatibilní
- **Patch** (0.0.Z) — opravy

---

## Fáze 3: RELEASE TAG (po schválení)

### 3.1 Aktualizace zálohy DB (pokud relevantní)
Pokud v cyklu vznikla významná runtime data (předpisy, platby, stravenky), před release:
```bash
cp prisma/dev.db prisma/dev.db.primary
```

### 3.2 Commit a tag
**VŽDY konkrétní soubory, ne `git add -A`** (CLAUDE.md konvence).

```bash
git add CHANGELOG.md package.json prisma/dev.db.primary
git commit -m "release: vX.Y.Z"
git tag -a vX.Y.Z -m "Release X.Y.Z – [stručný popis]"
git push origin main --tags
```

### 3.3 Ověření čisté instalace (kritický krok)
```bash
cd /tmp && rm -rf rael-release-test && git clone <repo-url> rael-release-test
cd rael-release-test
npm install
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
npx prisma db push && npm run db:seed
npm run dev
```
Ověř, že aplikace startuje a login funguje.

---

## Fáze 4: REPORT

Na konci vypiš / přidej do CHANGELOG.md:

```markdown
# Rael School – Release Report – vX.Y.Z

## Pre-release kontrola
| Kontrola | Stav |
|----------|------|
| Build | ✅/❌ |
| Lint | ✅/❌ |
| Testy | ✅/❌ |
| Čistá DB + seed | ✅/❌ |
| Všechny stránky | ✅/❌ |
| Všechny role | ✅/❌ |
| Dark mode | ✅/❌ |
| Lokalizace | ✅/❌ |
| Dokumentace | ✅/❌ |
| npm audit | ✅/⚠️/❌ |

## Release
- Git tag: `vX.Y.Z`
- Commit: `[hash]`
- CHANGELOG: aktualizován
- DB záloha: [aktualizována ✅ / beze změny]

## Známá omezení
- [pokud jsou]

## Co otestovat po nasazení
- [checklist]
```

---

## Spuštění

```
Přečti docs/agents/RELEASE-AGENT.md a připrav release. Nejdřív pre-release kontrola, pak po schválení vytvoř tag.
```
