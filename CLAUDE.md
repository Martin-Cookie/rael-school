# Pravidla projektu

> **UI/frontend konvence** (layout, tabulky, hooky, komponenty, dark mode, formuláře, navigace) jsou v **[docs/UI_GUIDE.md](docs/UI_GUIDE.md)**.
> Tento soubor definuje backend pravidla, datový model, workflow a projektová specifika.

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
- **Dark mode:** Tailwind `dark:` třídy + CSS proměnné, přepínání v sidebaru (Moon/Sun ikona)

## Kritické technické konvence

- Next.js 14 **NEPOUŽÍVÁ** `use(params)` hook — params jsou synchronní objekt `{ params: { id: string } }`, ne Promise
- Auth funkce: `getCurrentUser()` z `@/lib/auth`
- Toast notifikace: `const { message, showMsg } = useToast()` + `<Toast message={message} />`
- Čísla formátovat s oddělovačem tisíců (mezerou): `1 000` ne `1000`
- Měna za číslem: `fmtCurrency(1500, 'KES')` → `1 500 KES` (import z `@/lib/format`)
- Stravenky jsou vždy v KES
- Sazba stravenek (cena za 1 stravenku) je konfigurovatelná per měna v administraci (`VoucherRate` model), výchozí 80 CZK
- Konstanty `CURRENCIES = ['CZK', 'EUR', 'USD', 'KES']` — předdefinované měny používané v dropdownech
- Každý nový text v UI musí mít klíč ve **všech třech** jazycích (cs, en, sw)

## UI vzory

### Sdílené hooky a komponenty

Všechny hlavní stránky používají sdílené hooky a komponenty (místo dřívějšího copy-paste kódu):

| Hook / Komponenta | Soubor | Popis |
|---|---|---|
| `useLocale()` | `src/hooks/useLocale.ts` | Vrací `{ locale, t }` — locale stav + translator, naslouchá na `locale-change` event |
| `useSorting(valueExtractor?)` | `src/hooks/useSorting.ts` | Vrací `{ sortCol, sortDir, handleSort, sortData, setSortCol }` — třídění tabulek |
| `useStickyTop(deps)` | `src/hooks/useStickyTop.ts` | Vrací `{ stickyRef, theadTop }` — dynamická výška sticky hlavičky |
| `useToast()` | `src/hooks/useToast.ts` | Vrací `{ message, showMsg }` — toast notifikace |
| `<SortHeader>` | `src/components/SortHeader.tsx` | Tříditelná hlavička `<th>` se šipkami (ChevronUp/ChevronDown/ArrowUpDown) |
| `<Toast>` | `src/components/Toast.tsx` | Toast notifikace — `<Toast message={message} />` |
| `fmtCurrency()` | `src/lib/format.ts` | Formátování částky s měnou — `fmtCurrency(1500, 'KES')` → `1 500 KES` |

**useSorting — valueExtractor:**
- Default extractor zvládá: přímé property, nested (`student.className`), `_count.*` pro Prisma relace
- Vlastní extractor pro custom sloupce (`_studentName`, `_sponsorshipCount` atd.)

**Použití hooků na stránkách:**

| Stránka | useLocale | useSorting | useStickyTop | useToast | SortHeader | Toast |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|
| `students/page.tsx` | x | x | x | - | x | - |
| `sponsors/page.tsx` | x | x | x | x | x | x |
| `payments/page.tsx` | x | x | x | x | x | x |
| `dashboard/page.tsx` | x | x | x | - | x | - |
| `tuition/page.tsx` | x | x | x | x | x | x |
| `classes/page.tsx` | x | x | - | - | x | - |
| `payments/import/[id]/page.tsx` | x | x | - | x | vlastní SH* | x |
| `students/[id]/page.tsx` | x | - | - | x | - | x |

*Import detail má vlastní `SH` komponentu s odlišným stylem (`text-xs uppercase`), ale používá sdílený `useSorting` hook.

### Třídění tabulek (SortHeader pattern)

Stránky s tříděním:
| Stránka | Soubor | Sloupce |
|---------|--------|---------|
| Přehled | `dashboard/page.tsx` | Studenti, Sponzoři, Platby, Potřeby, Třídy |
| Studenti | `students/page.tsx` | Číslo, Příjmení, Jméno, Třída, Pohlaví, Věk, Potřeby, Sponzoři |
| Sponzoři | `sponsors/page.tsx` | Příjmení, Jméno, Email, Telefon, Studenti, Platby |
| Třídy | `classes/page.tsx` | Karty tříd (přirozené řazení PP1→Grade 12) + detail třídy se studenty |
| Platby – Sponzorské | `payments/page.tsx` | Datum, Typ, Částka, Student, Sponzor, Poznámky |
| Platby – Stravenky | `payments/page.tsx` | Datum nákupu, Částka, Počet, Student, Sponzor, Poznámky |
| Import detail | `payments/import/[id]/page.tsx` | Datum, Částka, Měna, Student, Sponzor, Typ, Stav |
| Předpisy školného | `tuition/page.tsx` | Student, Třída, Částka, Zaplaceno, Zbývá, Stav |

### Sticky layout seznamů

Všechny hlavní seznamy (Studenti, Sponzoři, Platby, Přehled) používají dvouvrstvý sticky layout:

**1. Sticky hlavička (z-30)** — title + search/tlačítka, vždy nahoře:
```
sticky top-16 lg:top-0 z-30 bg-[#fafaf8] pb-4 -mx-6 px-6 lg:-mx-8 lg:px-8
```
- `top-16` = pod mobilním headerem (64px), `lg:top-0` = na desktopu nahoře
- Negativní margin + padding = pozadí do krajů (kompenzuje padding rodiče)

**2. Sticky thead (z-20)** — řádek s třídícími hlavičkami, pod sticky hlavičkou:
```tsx
const { stickyRef, theadTop } = useStickyTop([loading])
// ...
<tr className="... bg-white sticky z-20" style={{ top: theadTop }}>
```
- `theadTop` = dynamicky měřená výška sticky hlavičky + mobilní offset
- Hook `useStickyTop` interně používá `ResizeObserver` + `window resize` listener
- Dependency `[loading]` — na stránkách s early `if (loading) return` se ref naplní až po načtení

**Důležité:**
- Tabulky NESMÍ být obaleny v `overflow-hidden` ani `overflow-x-auto` — tyto CSS vlastnosti vytvářejí nový scroll kontext a ruší `position: sticky`
- Pozadí thead musí být neprůhledné (`bg-white` nebo `bg-gray-50`, ne `bg-gray-50/50`)

**Bez stránkování** — všechny záznamy se zobrazují najednou (data se načítají celá z API)

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

10 záložek v tomto pořadí:

| # | Záložka | Klíč | Barva | Ikona |
|---|---------|------|-------|-------|
| 1 | Osobní údaje | `personal` | gray | User |
| 2 | Sponzoři | `sponsors` | accent | HandHeart |
| 3 | Vybavení | `equipment` | amber | Package |
| 4 | Potřeby | `needs` | rose | Heart |
| 5 | Přání | `wishes` | violet | Star |
| 6 | Stravenky | `vouchers` | blue | Ticket |
| 7 | Platby od sponzorů | `sponsorPayments` | indigo | CreditCard |
| 8 | Školné | `tuition` | emerald | FileText |
| 9 | Zdraví | `health` | teal | Stethoscope |
| 10 | Fotografie | `photos` | slate | Camera |

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
[        + Přidat         |   Zrušit       ]
```

- Název + Globe jsou na jednom řádku, Cena na samostatném řádku pod nimi
- Překladová pole jsou **vertikálně pod sebou** (ne vedle sebe)
- Globe tlačítko je **toggle** s vizuálním zvýrazněním aktivního stavu (modrý rámeček)
- Globe tlačítko má `flex-shrink-0` — nepřetéká přes okraj karty
- Tlačítko **Zrušit** se zobrazí jakmile uživatel začne vyplňovat — resetuje název, cenu i překlady

**Editace názvů existujících položek:**
- Klik na název položky → inline textový input (click-to-edit)
- Enter nebo blur uloží změnu přes PUT endpoint (`body.name`)
- Escape zruší editaci
- Tužka (Pencil) se zobrazí při hoveru nad položkou

**Editace překladu u existujících položek:**
- Ikona Globe na řádku položky (viditelná při hoveru)
- Klik otevře inline EN/SW inputy pod položkou (vertikálně)
- Uložení přes PUT endpoint (Enter nebo tlačítko Uložit)

**Translate endpoint:**
- `POST /api/admin/translate` — přijme `{ text }`, vrátí `{ en, sw }`
- Dvě paralelní volání MyMemory API (`cs|en`, `cs|sw`) přes `Promise.allSettled`
- Timeout 5s, vyžaduje autentizaci

### Sazby stravenek (VoucherRate)

Soubory:
- UI: `src/app/admin/page.tsx` (komponenta `VoucherRateSection`)
- Admin CRUD API: `src/app/api/admin/voucher-rates/route.ts`
- Veřejné čtení: `src/app/api/voucher-rates/route.ts`
- Prisma model: `VoucherRate` (currency unique, rate, isActive)

**Konfigurace:**
- Sazba = cena 1 stravenky v dané měně (např. CZK = 80, EUR = 3, USD = 3.5, KES = 80)
- Měny vybírané z dropdownu předdefinovaných měn (`CURRENCIES`), ne volný text
- Když jsou všechny měny nastaveny, formulář se skryje a zobrazí se info text

**Použití sazeb:**
| Místo | Soubor | Popis |
|-------|--------|-------|
| Detail studenta – záložka Stravenky | `students/[id]/page.tsx` | Auto-přepočet počtu stravenek z částky a měny |
| Platby – přidání nákupu stravenek | `payments/page.tsx` | Auto-přepočet + placeholder s aktuální sazbou |
| Import – split modal | `payments/import/[id]/page.tsx` | Předvyplnění počtu stravenek |
| Import – approve endpoint | `api/payment-imports/[id]/approve/route.ts` | Výpočet počtu stravenek na serveru |
| Import – split endpoint | `api/payment-imports/[id]/rows/[rowId]/split/route.ts` | Výpočet počtu stravenek na serveru |

**Fallback:** Pokud pro danou měnu neexistuje sazba, serverové endpointy použijí fallback `80`.

### Import bankovních výpisů — split a schvalování plateb

Soubory:
- Import detail UI: `src/app/payments/import/[id]/page.tsx`
- Split endpoint: `src/app/api/payment-imports/[id]/rows/[rowId]/split/route.ts`
- Approve endpoint: `src/app/api/payment-imports/[id]/approve/route.ts`

**Split flow (rozdělení platby na části):**
1. Uživatel klikne "Rozdělit" na řádku importu
2. V modálním okně nastaví částky, studenty a typ platby pro každou část (u Stravenek se zobrazí pole pro počet stravenek, předvyplněno z `VoucherRate` číselníku)
3. Split endpoint vytvoří child řádky (`parentRowId` → rodičovský řádek, status `SPLIT`)
4. **Auto-approve:** Pokud child řádek má vyplněný `studentId` + `paymentTypeId`, automaticky se schválí a vytvoří VoucherPurchase nebo SponsorPayment
5. Child řádky bez kompletních údajů zůstanou jako PARTIAL/NEW → schválí se ručně přes Approve

**VoucherPurchase z bank importu:**
- Nastavuje `sponsorId` (relace) i `donorName` (textové pole) — detail studenta zobrazuje `v.donorName`, stránka plateb zobrazuje `v.sponsor` s fallbackem na `v.donorName`
- Detekce stravenky: `paymentType.name` obsahuje "stravenk" nebo "voucher" (case-insensitive)
- Počet stravenek (`count`): z UI modalu, nebo fallback `Math.floor(amount / rate)` — sazba z `VoucherRate` číselníku (fallback 80)

**SponsorPayment z bank importu:**
- Nastavuje `sponsorId` (relace) — detail studenta i stránka plateb zobrazují přes `p.sponsor`

### Dark mode

Aplikace podporuje plný dark mode přepínatelný tlačítkem v sidebaru (Moon/Sun ikona).

**Implementace:**
- Třída `dark` na `<html>` elementu — Tailwind `darkMode: 'class'` v `tailwind.config.js`
- CSS proměnné v `globals.css` pro barvy pozadí, textu, borderů (`:root` / `.dark`)
- Stav uložen v `localStorage` (`rael-theme`) + systémová preference jako fallback
- Sidebar: `src/components/layout/Sidebar.tsx` — toggle `dark` třídy na `document.documentElement`

**Konvence pro dark mode v komponentách:**
- Karty/kontejnery: `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`
- Hlavní text: `text-gray-900 dark:text-gray-100`
- Sekundární text: `text-gray-700 dark:text-gray-300` nebo `text-gray-500 dark:text-gray-400`
- Ikony v barevných kruzích: `bg-*-50 dark:bg-*-900/30`, `text-*-600 dark:text-*-400`
- Inputy: `border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100`
- Sticky hlavičky: `bg-[#fafaf8] dark:bg-gray-900` (stránky), `bg-white dark:bg-gray-800` (thead)
- Tabulkové řádky: `border-gray-50 dark:border-gray-700`

### CSV export

Soubory:
- Helper: `src/lib/csv.ts` (funkce `downloadCSV`)
- UI tlačítka: na stránkách Studenti, Sponzoři, Platby

**Stránky s exportem:**
| Stránka | Soubor | Export |
|---------|--------|--------|
| Studenti | `students/page.tsx` | CSV se všemi studenty (číslo, jméno, třída, pohlaví, věk, potřeby, sponzoři) |
| Sponzoři | `sponsors/page.tsx` | CSV se sponzory (jméno, email, telefon, počet studentů, celkem plateb) |
| Platby | `payments/page.tsx` | CSV s platbami aktivního tabu (sponzorské nebo stravenky) |
| Předpisy | `tuition/page.tsx` | CSV s předpisy (číslo, jméno, třída, částka, zaplaceno, zbývá, stav, sponzor, typ, poznámky) |

**Funkce `downloadCSV(headers, rows, filename)`:**
- BOM prefix pro správné kódování v Excelu (UTF-8)
- Escapování uvozovek a čárek v hodnotách

### Předpisy školného (Tuition Charges)

Soubory:
- UI: `src/app/tuition/page.tsx`
- API: `src/app/api/tuition-charges/route.ts`
- Prisma model: `TuitionCharge` (studentId, period, amount, currency, status)
- Sazby: `TuitionRate` (annualFee, gradeFrom, gradeTo, currency)

**Souhrnné karty (3 bubliny):**

| Karta | Hlavní hodnota | Pod-text |
|-------|---------------|----------|
| Celkem předepsáno | Částka v CZK | Počet předpisů + roční/půlroční breakdown |
| Celkem zaplaceno | Částka v CZK (zelená) | Počet zaplacených / celkem |
| Celkem zbývá | Částka v CZK (červená) | Počet nezaplacených |

- **Roční** = period je jen rok (`"2026"`), **půlroční** = period obsahuje `-H` (`"2026-H1"`)
- Počty se zobrazují jako drobný text pod hlavní částkou

**Generování předpisů:**
- Panel s výběrem studentů (checkboxy, filtr tříd, hledání)
- Sazba se určí automaticky podle třídy studenta a `TuitionRate` číselníku
- Duplikáty se přeskakují (student + období)

**Tabulka předpisů:**

| Sloupec | Tříditelný | Popis |
|---------|-----------|-------|
| Student | ano | Jméno + číslo (odkaz na detail) |
| Třída | ano | Třída studenta |
| Částka | ano | Předepsaná částka |
| Zaplaceno | ano | Součet plateb typu školné pro studenta v daném roce |
| Zbývá | ano | Předepsáno − zaplaceno |
| Stav | ano | UNPAID / PARTIAL / PAID (barevný badge) |
| Sponzor | ne | Klikatelní sponzoři z plateb |
| Typ platby | ne | Typy plateb z přiřazených SponsorPayment |
| Poznámky | ne | Volitelné poznámky |

**Výpočet zaplacené částky:**
- Na serveru se sčítají `SponsorPayment` s typem obsahujícím "školné"/"tuition"/"karo"
- Filtrováno podle studenta, roku z periody a měny předpisu

### Cross-page navigace a klikatelné odkazy

**Klikatelní sponzoři v seznamu studentů:**
- Soubor: `students/page.tsx`
- Ve sloupci sponzorů jsou jména klikatelná → odkaz na stránku Sponzoři s hledáním (`/sponsors?search=...`)

**Zachování stavu hledání:**
- Stránka Sponzoři čte `?search=` z URL a předvyplní vyhledávací pole
- Při navigaci zpět z detailu studenta se stav hledání zachová

**Zachování aktivní záložky v dashboardu:**
- Soubor: `dashboard/page.tsx`
- Všechny odkazy z dashboardu kódují aktivní záložku v `from=` parametru: `from=/dashboard?tab=sponsors`
- Pomocná funkce `dashFrom()` generuje zakódovaný `from` URL s `tab` (a `paymentSubTab` pro platby)
- Při návratu dashboard čte `tab` a `paymentSubTab` z URL parametrů a obnoví správnou záložku
- Flow: Dashboard (záložka Sponzoři) → detail sponzora → zpět → Dashboard (záložka Sponzoři)

**Řetězová zpětná navigace (detail studenta):**
- Soubor: `students/[id]/page.tsx`
- Tlačítko zpět si pamatuje cestu: Studenti → Sponzoři → Detail → zpět na Sponzoře → zpět na Studenty
- Implementováno přes `document.referrer` a URL parametry

**Filtr sponzorů ve formuláři platby:**
- Soubor: `payments/page.tsx`
- Dropdown sponzorů ve formuláři platby se filtruje podle vybraného studenta (zobrazí jen sponzory přiřazené k danému studentovi)

### Filtrování a vyhledávání na stránce Platby

Soubor: `src/app/payments/page.tsx`

- Dvě záložky: Sponzorské platby / Stravenky
- **Vyhledávání** (textové pole) — filtruje podle jména studenta, sponzora, poznámek
- **Filtr Sponzor** — dropdown s unikátními sponzory z aktuálních dat
- **Filtr Typ** — dropdown s typy plateb (jen u sponzorských plateb)
- Filtry se kombinují (AND logika)
- Tlačítko **Zrušit** ve formulářích (sponzorské platby i stravenky) resetuje všechna pole do výchozích hodnot
- Auto-přepočet počtu stravenek: při zadání částky nebo změně měny se count přepočítá podle sazby z `VoucherRate` číselníku

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
| `prisma/dev.db.primary` | **PLNÁ ZÁLOHA** — vše včetně runtime dat (předpisy, platby, stravenky…) | `cp prisma/dev.db.primary prisma/dev.db` |
| `prisma/dev.db.backup` | Demo data — 30 testovacích studentů | `cp prisma/dev.db.backup prisma/dev.db` |
| `prisma/seed-demo.ts` | Demo seed script (30 testovacích studentů) | `cp prisma/seed-demo.ts prisma/seed.ts && npm run db:seed` |

### Zdrojová data

| Soubor | Obsah |
|--------|-------|
| `data/students-real.json` | 148 studentů — kompletní strukturovaná data (DOB, třída, škola, sponzoři, zdravotní stav, rodinná situace, 30 sourozeneckých skupin, přijaté předměty, zubní prohlídky) |
| `data/config-real.json` | Číselníky — třídy (PP1–Grade 12), typy plateb, školné, typy zdravotních prohlídek, měsíční sponzoři ordinace, sazby stravenek |

### Co je v záloze (dev.db.primary) vs. co je v seedu

| Data | dev.db.primary | seed.ts | Poznámka |
|------|:-:|:-:|--------|
| Studenti (148) | Ano | Ano | Ze `students-real.json` |
| Sponzoři (137) | Ano | Ano | Ze `students-real.json` |
| Sponzorství (160) | Ano | Ano | Vazby student↔sponzor |
| Vybavení (224) | Ano | Ano | Equipment z JSON |
| Zdravotní prohlídky (31) | Ano | Ano | HealthCheck z JSON |
| Uživatelé (admin, manager…) | Ano | Ano | S hesly |
| **Číselníky** (třídy, typy, potřeby…) | Ano | Ano | ClassRoom, PaymentType, NeedType… |
| **TuitionRate** (sazby školného) | Ano | Ano | 2 sazby (PP1–G6, G7–G12) |
| **VoucherRate** (sazby stravenek) | Ano | Ano | 4 měny (CZK, EUR, USD, KES) |
| **TuitionCharge** (předpisy) | **Ano** | **Ne** | Runtime — jen v záloze DB |
| **SponsorPayment** (platby) | **Ano** | **Ne** | Runtime — jen v záloze DB |
| **VoucherPurchase** (stravenky) | **Ano** | **Ne** | Runtime — jen v záloze DB |
| **Need, Wish** (potřeby/přání studentů) | **Ano** | **Ne** | Runtime — jen v záloze DB |
| **PaymentImport** (importy) | **Ano** | **Ne** | Runtime — jen v záloze DB |
| **Photo** (fotografie) | **Ano** | **Ne** | Runtime — jen v záloze DB |

### Obnovení dat

**Obnovit plnou zálohu (doporučeno):**
```bash
cp prisma/dev.db.primary prisma/dev.db
```
Obnoví vše — studenty, číselníky, **i předpisy, platby, stravenky a další runtime data**.

**Znovu naseedit od nuly (pouze základní data):**
```bash
npx prisma db push && npm run db:seed
```
Vytvoří studenty, sponzory, číselníky, sazby — ale **ne** předpisy, platby, stravenky a další runtime data.

**Obnovit demo data:**
```bash
cp prisma/dev.db.backup prisma/dev.db
```

**Znovu naseedit demo data:**
```bash
cp prisma/seed-demo.ts prisma/seed.ts && npm run db:seed
```

### Aktualizace primární zálohy

Po vytvoření důležitých runtime dat (předpisy, platby…) je nutné aktualizovat zálohu:
```bash
cp prisma/dev.db prisma/dev.db.primary
git add prisma/dev.db.primary && git commit -m "Update primary DB backup" && git push origin main
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

---

## Pravidla pro práci na úkolech

### Vždy dodržuj tento postup:

1. **Přečti CLAUDE.md** a pochop strukturu projektu
2. **Analyzuj** současný stav relevantních souborů — VŽDY číst z disku, ne z paměti
3. **Pokud ti něco není jasné — ZEPTEJ SE**, nedomýšlej si
4. **Ukaž strukturovaný plán** přes update_plan tool (co budeš měnit, které soubory, jak)
5. **POČKEJ NA SCHVÁLENÍ** — neimplementuj dokud uživatel neschválí plán
6. **Implementuj** po schválení
7. **Ověř** že existující funkce stále fungují (spusť `npm run dev`, otestuj dotčené stránky)
8. **Commitni a pushni** každý úkol zvlášť s výstižnou českou commit message
9. Pokud měníš strukturu projektu → **aktualizuj CLAUDE.md**
10. **Aktualizuj dokumentaci** po každém pushi

### Na konci každého úkolu vypiš:
- Co jsi změnil (soubory + stručný popis)
- Co má uživatel otestovat (konkrétní URL a kroky)
- Příkaz pro aktualizaci na lokále: `git pull origin main && npm run dev`

### Při více úkolech:
- Dělej úkoly JEDEN PO DRUHÉM (ne všechny najednou)
- Po každém úkolu commitni a pushni zvlášť
- Na konci vypiš souhrnnou tabulku:

| # | Úkol | Stav | Změněné soubory | Co otestovat |
|---|------|------|-----------------|--------------|

### Striktní pravidla:
- **Piš česky** (komunikace i commit messages)
- **Nedělej víc než je zadáno**
- **Nedomýšlej si požadavky** — radši se zeptej
- **Neměň nesouvisející kód** — i když vidíš problém, pouze ho nahlas
- **Každý nový text v UI** musí mít klíč ve všech třech jazycích (cs, en, sw)
- **Po opravě chyby** se zeptej, zda se stejný problém nemá zkontrolovat v celém projektu
