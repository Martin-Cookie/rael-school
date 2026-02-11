# CLAUDE.md — Pravidla pro práci s projektem Rael School

## Obecná pravidla

- **VŽDY si před úpravou přečti aktuální verzi souboru z disku** — nikdy nepracuj z paměti nebo z předchozí konverzace
- Před každou změnou stručně vysvětli, co budeš dělat, a počkej na souhlas
- Po každé změně vypiš seznam změněných souborů
- Pokud si nejsi jistý, zeptej se — raději se zeptej dvakrát, než udělej chybu
- Při rozsáhlejších změnách postupuj po menších krocích, ne vše najednou

## Zakázané automatické akce

- **NECOMMITUJ** do Gitu bez explicitního pokynu uživatele
- **NEMĚŇ** PROJECT_SPEC.md bez explicitního pokynu uživatele
- **NEMĚŇ** soubory, o kterých se zrovna nemluví
- **NEINSTALUJ** nové npm balíčky bez souhlasu

## Příkazy na vyzvání

Tyto akce proveď pouze když uživatel výslovně řekne:

### "Commitni" nebo "Pushni"
1. Spusť `git status` a ukaž změny
2. Navrhni commit message (česky)
3. Po odsouhlasení proveď `git add .`, `git commit -m "..."`, `git push`

### "Aktualizuj specifikaci"
1. Projdi všechny soubory v projektu
2. Porovnej aktuální stav kódu s PROJECT_SPEC.md
3. Aktualizuj PROJECT_SPEC.md tak, aby:
   - Přesně odpovídal aktuálnímu stavu kódu
   - Byl dostatečně podrobný pro reprodukci projektu od nuly
   - Měl aktualizovanou historii verzí
4. Ukaž uživateli diff změn před uložením

## Technický stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Databáze:** SQLite + Prisma ORM
- **CSS:** Tailwind CSS
- **Autentizace:** JWT (httpOnly cookies) + bcrypt
- **Ikony:** lucide-react
- **Datum:** date-fns
- **Lokalizace:** Vlastní i18n (cs/en/sw)

## Kritické technické konvence

- Next.js 14 **NEPOUŽÍVÁ** `use(params)` hook — params jsou synchronní objekt `{ params: { id: string } }`, ne Promise
- Všechny API routes mají stejné params: `{ params }: { params: { id: string } }` (bez Promise, bez await)
- Auth funkce: `getCurrentUser()` z `@/lib/auth` (NE `verifyAuth`)
- Toast notifikace: `showMsg('success' | 'error', text)` (NE `showToast`)
- Text v celé aplikaci: **#1a1a1a** (černý) — žádný šedý text pro hlavní obsah
- Čísla formátovat s oddělovačem tisíců (mezerou): `1 000` ne `1000`
- Měna za číslem: `1 500 KES`
- Stravenky jsou vždy v KES
- Dropdown pro sponzory v platbách načítá VŠECHNY aktivní sponzory

## Struktura projektu

```
rael-school/
├── CLAUDE.md              ← tento soubor (pravidla pro Claude)
├── PROJECT_SPEC.md        ← kompletní zadání (zdroj pravdy)
├── prisma/
│   ├── schema.prisma      ← databázové schéma
│   └── seed.ts            ← testovací data
├── src/
│   ├── app/               ← stránky a API routes
│   ├── components/        ← UI komponenty
│   ├── lib/               ← utility (auth, db, i18n, format)
│   └── messages/          ← překlady (cs.json, en.json, sw.json)
├── public/uploads/        ← nahrané fotky studentů
└── .env                   ← DATABASE_URL, JWT_SECRET
```

## Klíčové soubory

| Soubor | Účel |
|--------|------|
| `src/lib/auth.ts` | JWT, bcrypt, `getCurrentUser()`, `canEdit()` |
| `src/lib/db.ts` | Prisma singleton |
| `src/lib/i18n.ts` | `createTranslator()`, dot notation, interpolace |
| `src/lib/format.ts` | `formatNumber`, `formatCurrency`, `formatDate`, `calculateAge` |
| `src/components/layout/Sidebar.tsx` | Navigace, přepínač jazyků, profil |

## Prostředí

- Uživatel pracuje na **macOS**
- Projekt je v `~/Documents/rael-school`
- Spuštění: `npm run dev` → http://localhost:3000
- Setup: `npm run setup` (prisma generate + db push + seed)

## Překlady

- Každý nový text v UI musí mít klíč ve **všech třech** jazycích (cs, en, sw)
- Soubory: `src/messages/cs.json`, `en.json`, `sw.json`
- Používej dot notation: `student.firstName`, `nav.dashboard` atd.

## Uživatelské role

| Role | Práva |
|------|-------|
| ADMIN | Plný přístup, správa uživatelů, mazání |
| MANAGER | Editace studentů, přidávání dat, přehledy |
| SPONSOR | Pouze své přiřazené studenty (read-only) |
| VOLUNTEER | Editace studentů, přidávání dat |
