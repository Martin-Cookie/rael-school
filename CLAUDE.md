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

## Lokální prostředí uživatele

- **Hlavní branch na lokále uživatele je `main`** (ne `master`)
- Při merge do hlavního branche vždy používat `main`

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
| Třídy | `classes/page.tsx` | Karty tříd (přirozené řazení PP1→Grade 12) + detail třídy se studenty |
| Platby – Sponzorské | `payments/page.tsx` | Datum, Typ, Částka, Student, Sponzor, Poznámky |
| Platby – Stravenky | `payments/page.tsx` | Datum nákupu, Částka, Počet, Student, Sponzor, Poznámky |
| Import detail | `payments/import/[id]/page.tsx` | Datum, Částka, Měna, Student, Sponzor, Typ, Stav |

### Dashboard — přehled tříd a cross-tab navigace

**Přehled tříd (záložka Třídy):**
- Místo tabulky zobrazeny jako **karty/bubliny** v gridu (2→3→4 sloupce dle šířky)
- Přirozené řazení: PP1, PP2, Grade 1, Grade 2, …, Grade 12
- Klik na kartu → detail třídy se seznamem studentů

**Cross-tab navigace (klikatelné názvy tříd):**
- V záložkách **Studenti** a **Potřeby** je název třídy klikatelný
- Klik přepne na záložku Třídy s detailem dané třídy
- Tlačítko zpět vrací na **zdrojovou záložku** (ne na přehled tříd) — implementováno přes `useRef<DashTab>` (`prevTabRef`)
- Pokud uživatel přišel přímo z přehledu tříd, zpět vrací na grid tříd

**Karta Celkem studentů:**
- Pod hlavním číslem zobrazuje počet chlapců / dívek

### Detail studenta — záložky

Soubor: `src/app/students/[id]/page.tsx`

9 záložek v tomto pořadí:

| # | Záložka | Klíč | Barva | Ikona |
|---|---------|------|-------|-------|
| 1 | Osobní údaje | `personal` | gray | User |
| 2 | Sponzoři | `sponsors` | accent | HandHeart |
| 3 | Vybavení | `equipment` | amber | Package |
| 4 | Potřeby | `needs` | rose | Heart |
| 5 | Přání | `wishes` | violet | Star |
| 6 | Stravenky | `vouchers` | blue | Ticket |
| 7 | Platby od sponzorů | `sponsorPayments` | indigo | CreditCard |
| 8 | Zdraví | `health` | teal | Stethoscope |
| 9 | Fotografie | `photos` | slate | Camera |

### Návštěvní karty (Visit Cards) — tiskový layout

Soubor: `src/app/reports/visit-cards/print/page.tsx`

Dvoustránkový A4 formulář pro každého studenta (výška stránky `calc(297mm - 16mm)`):

| Stránka | Sekce |
|---------|-------|
| 1 | Header, Sponzoři, Základní info (třída, škola, DOB, pohlaví, osiřelost, zdraví), Rodina, Vybavení |
| 2 | Potřeby, Přání, Obecné poznámky (flex-fill do konce stránky) |

**Layout sekcí na stránce 2:**

| Sekce | Layout |
|-------|--------|
| Potřeby | CSS grid 3 sloupce — checkbox + název + cena (bez individuálních poznámek) |
| Přání | CSS grid 3 sloupce — checkbox + název + cena (bez individuálních poznámek) |
| Obecné poznámky | flex-fill do konce stránky |

**Layout tabulky Vybavení (stránka 1, colgroup + table-fixed):**

| Sekce | Sloupce (šířky) |
|-------|----------------|
| Vybavení | checkbox 4%, typ 22%, stav 11%, cena 8%, poznámky 55% |

- Tisk přes iframe (izolovaný HTML snapshot nezávislý na React lifecycle)
- Poznámkový rámeček na stránce 2 se automaticky roztáhne do konce stránky (flex: 1)
- Ceny z číselníků `needTypes`, `wishTypes`, `equipmentTypes` (API `/api/reports/visit-cards`)

### Administrace číselníků — auto-překlad

Soubory:
- UI: `src/app/admin/page.tsx` (komponenta `CodelistSection`)
- Translate endpoint: `src/app/api/admin/translate/route.ts`

**Přidání nové položky s překladem:**
1. Admin zadá český název
2. Klikne Globe tlačítko → otevře EN/SW pole + spustí auto-překlad (MyMemory API)
3. Opětovný klik na Globe → skryje překladová pole a vymaže hodnoty
4. Po kliknutí "Přidat" se pole automaticky skryjí

**Layout vstupního formuláře:**
```
[ Český název (celá šířka)          ] [ 🌐 ]
[ Cena ]                  ← jen u číselníků s cenou
[ EN: auto-překlad                         ]
[ SW: auto-překlad                         ]
[              + Přidat                     ]
```

- Název + Globe jsou na jednom řádku, Cena na samostatném řádku pod nimi
- Překladová pole jsou **vertikálně pod sebou** (ne vedle sebe)
- Globe tlačítko je **toggle** s vizuálním zvýrazněním aktivního stavu (modrý rámeček)
- Globe tlačítko má `flex-shrink-0` — nepřetéká přes okraj karty

**Editace překladu u existujících položek:**
- Ikona Globe na řádku položky (viditelná při hoveru)
- Klik otevře inline EN/SW inputy pod položkou (vertikálně)
- Uložení přes PUT endpoint (Enter nebo tlačítko Uložit)

**Translate endpoint:**
- `POST /api/admin/translate` — přijme `{ text }`, vrátí `{ en, sw }`
- Dvě paralelní volání MyMemory API (`cs|en`, `cs|sw`) přes `Promise.allSettled`
- Timeout 5s, vyžaduje autentizaci

### Import bankovních výpisů — split a schvalování plateb

Soubory:
- Import detail UI: `src/app/payments/import/[id]/page.tsx`
- Split endpoint: `src/app/api/payment-imports/[id]/rows/[rowId]/split/route.ts`
- Approve endpoint: `src/app/api/payment-imports/[id]/approve/route.ts`

**Split flow (rozdělení platby na části):**
1. Uživatel klikne "Rozdělit" na řádku importu
2. V modálním okně nastaví částky, studenty a typ platby pro každou část (u Stravenek se zobrazí pole pro počet stravenek, předvyplněno `amount / 80 KES`)
3. Split endpoint vytvoří child řádky (`parentRowId` → rodičovský řádek, status `SPLIT`)
4. **Auto-approve:** Pokud child řádek má vyplněný `studentId` + `paymentTypeId`, automaticky se schválí a vytvoří VoucherPurchase nebo SponsorPayment
5. Child řádky bez kompletních údajů zůstanou jako PARTIAL/NEW → schválí se ručně přes Approve

**VoucherPurchase z bank importu:**
- Nastavuje `sponsorId` (relace) i `donorName` (textové pole) — detail studenta zobrazuje `v.donorName`, stránka plateb zobrazuje `v.sponsor` s fallbackem na `v.donorName`
- Detekce stravenky: `paymentType.name` obsahuje "stravenk" nebo "voucher" (case-insensitive)
- Počet stravenek (`count`): z UI modalu, nebo fallback `Math.floor(amount / 80)` — cena 1 stravenky = 80 KES

**SponsorPayment z bank importu:**
- Nastavuje `sponsorId` (relace) — detail studenta i stránka plateb zobrazují přes `p.sponsor`

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
