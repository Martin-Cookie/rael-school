# Pravidla projektu

## Workflow pro změny kódu

1. **Udělej změnu kódu** podle pokynu uživatele
2. **Commitni a pushni** na GitHub (aby si uživatel mohl stáhnout změny)
3. **Pošli uživateli jeden kombinovaný příkaz** pro aktualizaci a restart na lokálním počítači:
   ```bash
   git pull origin <aktuální-branch> && npm run dev
   ```
   (Uživatel si sám předtím ukončí server pomocí Ctrl+C.)
4. **Počkej** až uživatel otestuje změny na lokále
5. Pokud něco není v pořádku, **oprav a znovu pushni**

## Dokumentace

- Po každém commitu a push na GitHub aktualizuj dokumentaci projektu.

## Obecná pravidla

- **VŽDY si před úpravou přečti aktuální verzi souboru z disku** — nikdy nepracuj z paměti nebo z předchozí konverzace
- Pokud si nejsi jistý, zeptej se
- Při rozsáhlejších změnách postupuj po menších krocích

## Technický stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Databáze:** SQLite + Prisma ORM
- **CSS:** Tailwind CSS
- **Autentizace:** JWT (httpOnly cookies) + bcrypt
- **Ikony:** lucide-react
- **Lokalizace:** Vlastní i18n (cs/en/sw)

## Kritické technické konvence

- Next.js 14 **NEPOUŽÍVÁ** `use(params)` hook — params jsou synchronní objekt `{ params: { id: string } }`, ne Promise
- Auth funkce: `getCurrentUser()` z `@/lib/auth`
- Toast notifikace: `showMsg('success' | 'error', text)`
- Čísla formátovat s oddělovačem tisíců (mezerou): `1 000` ne `1000`
- Měna za číslem: `1 500 KES`
- Stravenky jsou vždy v KES
- Každý nový text v UI musí mít klíč ve **všech třech** jazycích (cs, en, sw)

## UI vzory

### Třídění tabulek (SortHeader pattern)

Všechny hlavní stránky se seznamy používají jednotný vzor tříditelné tabulky:

- **`handleSort(col)`** — přepíná asc/desc, nebo nastaví nový sloupec
- **`sortData(data, col)`** — třídí pole podle sloupce (čísla numericky, řetězce abecedně, `_count.*` pro Prisma relace)
- **`SH` komponenta** — tříditelná hlavička `<th>` se šipkami (ChevronUp/ChevronDown/ArrowUpDown)

Stránky s tímto vzorem:
| Stránka | Soubor | Sloupce |
|---------|--------|---------|
| Přehled | `dashboard/page.tsx` | Studenti, Sponzoři, Platby, Potřeby, Třídy |
| Studenti | `students/page.tsx` | Číslo, Příjmení, Jméno, Třída, Pohlaví, Věk, Potřeby, Sponzoři |
| Sponzoři | `sponsors/page.tsx` | Příjmení, Jméno, Email, Telefon, Studenti, Platby |
| Třídy | `classes/page.tsx` | Název třídy, Počet studentů + detail třídy se studenty |

## Uživatelské role

| Role | Práva |
|------|-------|
| ADMIN | Plný přístup, správa uživatelů, mazání |
| MANAGER | Editace studentů, přidávání dat, přehledy |
| SPONSOR | Pouze své přiřazené studenty (read-only) |
| VOLUNTEER | Editace studentů, přidávání dat |

## Zálohy databáze a dat

### Záložní soubory

| Soubor | Obsah | Obnovení |
|--------|-------|----------|
| `prisma/dev.db.primary` | **VSTUPNÍ PRIMÁRNÍ DATA** — 148 reálných studentů, 137 sponzorů | `cp prisma/dev.db.primary prisma/dev.db` |
| `prisma/dev.db.backup` | Demo data — 30 testovacích studentů | `cp prisma/dev.db.backup prisma/dev.db` |
| `prisma/seed-demo.ts` | Demo seed script (30 testovacích studentů) | `cp prisma/seed-demo.ts prisma/seed.ts && npm run db:seed` |

### Zdrojová data

| Soubor | Obsah |
|--------|-------|
| `data/students-real.json` | 148 studentů — kompletní strukturovaná data (DOB, třída, škola, sponzoři, zdravotní stav, rodinná situace, 30 sourozeneckých skupin, přijaté předměty, zubní prohlídky) |
| `data/config-real.json` | Číselníky — třídy (PP1–Grade 12), typy plateb, školné, typy zdravotních prohlídek, měsíční sponzoři ordinace |

### Obnovení dat

**Obnovit primární reálná data:**
```bash
cp prisma/dev.db.primary prisma/dev.db
```

**Obnovit demo data:**
```bash
cp prisma/dev.db.backup prisma/dev.db
```

**Znovu naseedit reálná data (ze JSON):**
```bash
npx prisma db push && npm run db:seed
```

**Znovu naseedit demo data:**
```bash
cp prisma/seed-demo.ts prisma/seed.ts && npm run db:seed
```

**Jak se dostat k datům při ztrátě kontextu:**
Řekněte: _"Přečti si soubory `data/students-real.json` a `data/config-real.json`."_

### Přihlašovací údaje

| Účet | Email | Heslo |
|------|-------|-------|
| Admin | admin@rael.school | admin123 |
| Manager | manager@rael.school | manager123 |
| Sponzor | `<jmeno.prijmeni>@sponsor.rael.school` | sponsor123 |
| Dobrovolník | volunteer@rael.school | volunteer123 |

## Čistá instalace a obnovení lokálu z GitHubu

Kompletní postup pro rozběhání aplikace na čistém lokále (nebo po ztrátě `.env` / databáze):

```bash
# 1. Stáhnout poslední změny
git pull origin <aktuální-branch>

# 2. Nainstalovat závislosti
npm install

# 3. Vytvořit .env (soubor je v .gitignore, nepřenáší se)
echo 'DATABASE_URL="file:./dev.db"' > .env

# 4. Vytvořit tabulky + naseedit data (148 studentů, 137 sponzorů, číselníky)
npx prisma db push && npm run db:seed

# 5. Spustit vývojový server
npm run dev
```

**Jednořádková verze (vše najednou):**
```bash
npm install && echo 'DATABASE_URL="file:./dev.db"' > .env && npx prisma db push && npm run db:seed && npm run dev
```

**Pozn.:** Soubor `.env` stačí vytvořit jednou. Při běžných aktualizacích pak stačí:
```bash
git pull origin <aktuální-branch> && npm run dev
```

### Statistiky reálných dat

- **148 studentů** (8 bez sponzora)
- **137 unikátních sponzorů**
- **160 sponzorských vazeb**
- **224 položek vybavení**
- **31 zdravotních prohlídek**
- **30 sourozeneckých skupin**
- **14 tříd** (PP1–Grade 12), celkem 467 aktivních žáků
- **Školné:** 3 700 CZK (do Grade 6), 4 700 CZK (od Grade 7)
