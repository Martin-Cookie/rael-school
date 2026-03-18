# Release Agent – Příprava verze (Rael School)

> Spouštěj když chceš vydat novou verzi aplikace.
> Agent zkontroluje připravenost, vytvoří changelog a otaguje verzi.

---

## Cíl

Ověřit že aplikace je v konzistentním stavu, vytvořit changelog a připravit release tag.

---

## Instrukce

### Fáze 1: PRE-RELEASE KONTROLA (nic neměň)

Projdi projekt a ověř připravenost k vydání:

#### 1.1 Kód
- Spusť `npm run build` — musí projít bez chyb
- Spusť `npm run lint` — žádné chyby (warnings OK)
- Žádné `TODO`, `FIXME`, `HACK` které blokují release
- Žádné hardcoded debug hodnoty (`console.log`, testovací emaily/hesla kromě seed dat)
- `package.json` má správné závislosti

#### 1.2 Databáze
- Prisma schema odpovídá aktuální DB: `npx prisma db push` bez chyb
- Seed funguje na čisté DB: smaž `prisma/dev.db`, spusť `npx prisma db push && npm run db:seed`
- Záloha `prisma/dev.db.primary` je aktuální (obsahuje runtime data)

#### 1.3 Soubory
- `.gitignore` je kompletní (`.env`, `node_modules/`, `prisma/dev.db`)
- `.env` NENÍ v repozitáři
- `data/students-real.json` a `data/config-real.json` jsou aktuální
- Žádné citlivé údaje v kódu ani v git historii

#### 1.4 Dokumentace
- README.md je aktuální (instalace, spuštění, moduly)
- CLAUDE.md odpovídá realitě
- docs/UI_GUIDE.md odpovídá realitě

#### 1.5 Funkčnost
- Spusť `npm run dev` a projdi KAŽDOU stránku v sidebaru — žádné chyby?
- Přihlášení funguje pro všechny role (admin, manager, sponsor, volunteer)?
- Dashboard se načte správně?
- CRUD operace fungují (přidání, editace, smazání studenta)?
- Import bankovních výpisů funguje?
- CSV export funguje?
- Tisk visit cards funguje?
- Dark mode funguje na všech stránkách?
- Lokalizace — všechny texty mají cs/en/sw překlad?

### Fáze 2: CHANGELOG

Porovnej aktuální stav s posledním tagem/release:

```bash
git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~50)..HEAD
```

Vytvoř/aktualizuj `CHANGELOG.md`:

```markdown
## [verze] – YYYY-MM-DD

### Nové funkce
- [popis viditelný pro uživatele]

### Opravy
- [popis opravených chyb]

### Změny
- [změny v chování, UI úpravy]

### Technické
- [migrace, závislosti, interní změny]
```

### Fáze 3: RELEASE TAG

Po schválení changelogu:

1. **Aktualizuj zálohu DB** (pokud se změnila runtime data):
   ```bash
   cp prisma/dev.db prisma/dev.db.primary
   ```

2. **Commitni a tagni:**
   ```bash
   git add -A
   git commit -m "release: vX.Y.Z"
   git tag -a vX.Y.Z -m "Release X.Y.Z – [stručný popis]"
   git push origin main --tags
   ```

3. **Ověř čistou instalaci** (simulace nového uživatele):
   ```bash
   cd /tmp
   git clone <repo-url> rael-test
   cd rael-test
   npm install
   echo 'DATABASE_URL="file:./dev.db"' > .env
   npx prisma db push && npm run db:seed
   npm run dev
   ```
   Ověř že aplikace funguje.

### Fáze 4: REPORT

Na konci vypiš:

```
## Release Report – vX.Y.Z

### Pre-release kontrola
- Build: ✅/❌
- Lint: ✅/❌
- Čistá DB + seed: ✅/❌
- Všechny stránky: ✅/❌
- Všechny role: ✅/❌
- Dark mode: ✅/❌
- Lokalizace: ✅/❌
- Dokumentace: ✅/❌

### Release
- Git tag: vX.Y.Z
- Changelog: aktualizován
- DB záloha: aktualizována ✅/❌

### Známá omezení
- [pokud nějaké jsou]
```

---

## Spuštění

V Claude Code zadej:

```
Přečti soubor RELEASE-AGENT.md a připrav release. Nejdřív proveď pre-release kontrolu, pak po schválení vytvoř tag.
```
