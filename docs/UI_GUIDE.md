# UI Guide — Rael School

Tento soubor je **jediný zdroj pravdy** pro UI/frontend vzory a konvence. Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + lucide-react**.

> Backend pravidla (API, Prisma, modely, autentizace, workflow) jsou v [CLAUDE.md](./CLAUDE.md).

---

## 1. Sdílené hooky a komponenty

| Hook / Komponenta | Soubor | Popis |
|---|---|---|
| `useLocale()` | `src/hooks/useLocale.ts` | Vrací `{ locale, t }` — locale stav + translator, naslouchá na `locale-change` event |
| `useSorting(valueExtractor?)` | `src/hooks/useSorting.ts` | Vrací `{ sortCol, sortDir, handleSort, sortData, setSortCol }` — třídění tabulek |
| `useStickyTop(deps)` | `src/hooks/useStickyTop.ts` | Vrací `{ stickyRef, theadTop }` — dynamická výška sticky hlavičky |
| `useToast()` | `src/hooks/useToast.ts` | Vrací `{ message, showMsg }` — toast notifikace |
| `<SortHeader>` | `src/components/SortHeader.tsx` | Tříditelná hlavička `<th>` se šipkami (ChevronUp/ChevronDown/ArrowUpDown) |
| `<Toast>` | `src/components/Toast.tsx` | Toast notifikace — `<Toast message={message} />` |
| `fmtCurrency()` | `src/lib/format.ts` | Formátování částky s měnou — `fmtCurrency(1500, 'KES')` → `1 500 KES` |

### Použití hooků na stránkách

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

### Pravidla pro nové stránky

- Každá stránka s tabulkou MUSÍ používat sdílené hooky — žádný copy-paste kód
- `useLocale()` je povinný na KAŽDÉ stránce s textem
- `useSorting()` je povinný na KAŽDÉ stránce s tabulkou

---

## 2. Layout

### Sticky hlavička (dvouvrstvý layout)

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
- Tabulky NESMÍ být obaleny v `overflow-hidden` ani `overflow-x-auto` — ruší `position: sticky`
- Pozadí thead musí být neprůhledné (`bg-white` nebo `bg-gray-50`, ne `bg-gray-50/50`)
- Bez stránkování — všechny záznamy se zobrazují najednou

---

## 3. Tabulky

### Řazení sloupců (SortHeader pattern)

Stránky s tříděním:

| Stránka | Soubor | Sloupce |
|---------|--------|---------|
| Přehled | `dashboard/page.tsx` | Studenti, Sponzoři, Platby, Potřeby, Třídy, Školné |
| Studenti | `students/page.tsx` | Číslo, Příjmení, Jméno, Třída, Pohlaví, Věk, Potřeby, Sponzoři |
| Sponzoři | `sponsors/page.tsx` | Příjmení, Jméno, Email, Telefon, Studenti, Platby |
| Třídy | `classes/page.tsx` | Karty tříd (přirozené řazení PP1→Grade 12) + detail třídy se studenty |
| Platby – Sponzorské | `payments/page.tsx` | Datum, Typ, Částka, Student, Sponzor, Poznámky |
| Platby – Stravenky | `payments/page.tsx` | Datum nákupu, Částka, Počet, Student, Sponzor, Poznámky |
| Import detail | `payments/import/[id]/page.tsx` | Datum, Částka, Měna, Student, Sponzor, Typ, Stav |
| Předpisy školného | `tuition/page.tsx` | Student, Třída, Částka, Zaplaceno, Zbývá, Stav |

### useSorting — valueExtractor
- Default extractor zvládá: přímé property, nested (`student.className`), `_count.*` pro Prisma relace
- Vlastní extractor pro custom sloupce (`_studentName`, `_sponsorshipCount` atd.)

### Řádkové akce
- Ikony z `lucide-react` (Pencil, Trash2, Download, Eye)
- Hover efekty konzistentní s barvou akce
- Vždy `title` atribut pro tooltip

---

## 4. Formuláře

### Tlačítka — kanonické styly

| Typ | Styl | Použití |
|-----|------|---------|
| **Primární** | `bg-primary-600 text-white hover:bg-primary-700 rounded-xl px-4 py-2.5 text-sm font-medium` | Uložit, Přidat |
| **Sekundární (šedé)** | `bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl px-5 py-2.5 text-sm font-medium` | Zrušit |
| **Danger (červené)** | `bg-red-600 text-white hover:bg-red-700 rounded-xl px-4 py-2.5 text-sm font-medium` | Smazat |
| **Success (zelené)** | `bg-green-600 text-white hover:bg-green-700 rounded-xl px-4 py-2.5 text-sm font-medium` | Potvrdit, Schválit |

### Input styly
```
border border-gray-300 rounded-lg text-sm px-3 py-2 outline-none
focus:ring-2 focus:ring-primary-500 focus:border-primary-500
dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100
```

---

## 5. Status badge

```tsx
<span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-{color}-100 text-{color}-700 dark:bg-{color}-900/30 dark:text-{color}-400">
```
- Šedá = neutrální, zelená = success/paid, modrá = info, červená = error/unpaid, žlutá = warning/partial
- Vždy `rounded-full` + `inline-block`
- Vždy přidat dark mode varianty (`dark:bg-*-900/30 dark:text-*-400`)

---

## 6. Dark mode

### Implementace
- Třída `dark` na `<html>` elementu — Tailwind `darkMode: 'class'` v `tailwind.config.js`
- CSS proměnné v `globals.css` pro barvy pozadí, textu, borderů (`:root` / `.dark`)
- Stav uložen v `localStorage` (`rael-theme`) + systémová preference jako fallback
- Přepínač v sidebaru: `src/components/layout/Sidebar.tsx` — Moon/Sun ikona

### Konvence pro dark mode v komponentách

| Prvek | Light | Dark |
|-------|-------|------|
| Karty/kontejnery | `bg-white` | `dark:bg-gray-800` |
| Border | `border-gray-200` | `dark:border-gray-700` |
| Hlavní text | `text-gray-900` | `dark:text-gray-100` |
| Sekundární text | `text-gray-700` | `dark:text-gray-300` |
| Terciární text | `text-gray-500` | `dark:text-gray-400` |
| Ikony v kruzích | `bg-*-50` | `dark:bg-*-900/30` |
| Ikony text | `text-*-600` | `dark:text-*-400` |
| Inputy | `border-gray-300` | `dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100` |
| Sticky hlavičky stránek | `bg-[#fafaf8]` | `dark:bg-gray-900` |
| Sticky thead | `bg-white` | `dark:bg-gray-800` |
| Tabulkové řádky border | `border-gray-50` | `dark:border-gray-700` |

### Pravidlo pro nové komponenty
- VŽDY přidat `dark:` varianty ke všem barvám pozadí, textu a borderů
- Testovat v obou režimech před commitem

---

## 7. Dashboard

### Záložky dashboardu (6)

`type DashTab = 'students' | 'sponsors' | 'payments' | 'needs' | 'classes' | 'tuition'`

- **Platby** mají sub-záložky: Sponzorské / Stravenky

### Přehled tříd (záložka Třídy)
- Místo tabulky zobrazeny jako **karty/bubliny** v gridu (2→3→4 sloupce dle šířky)
- Přirozené řazení: PP1, PP2, Grade 1, Grade 2, …, Grade 12
- Klik na kartu → detail třídy se seznamem studentů

### Cross-tab navigace
- V záložkách Studenti a Potřeby je název třídy klikatelný
- Klik přepne na záložku Třídy s detailem dané třídy
- Tlačítko zpět vrací na **zdrojovou záložku** (ne na přehled tříd) — `useRef<DashTab>` (`prevTabRef`)

### Karta Celkem studentů
- Pod hlavním číslem zobrazuje počet chlapců / dívek

---

## 8. Detail studenta — záložky

Soubory:
- Hlavní stránka: `src/app/students/[id]/page.tsx` (599 řádků)
- Záložky: `src/components/student-detail/` (10 tab komponent + FormFields)

### Lazy-load dat per záložka

Data se nenačítají všechna najednou. Na mount se fetchne pouze student + user role. Číselníky pro konkrétní záložku se načítají při prvním kliknutí:

| Záložka | Fetchuje |
|---------|----------|
| personal | classrooms |
| equipment | classrooms, equipmentTypes |
| needs | needTypes |
| wishes | wishTypes |
| vouchers | voucherRates |
| sponsorPayments | paymentTypes |
| tuition | tuitionCharges |
| health | healthTypes |
| sponsors, photos | — (data jsou v student objektu) |

### 10 záložek v tomto pořadí:

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

---

## 9. Cross-page navigace a odkazy

### Klikatelní sponzoři v seznamu studentů
- Ve sloupci sponzorů jsou jména klikatelná → `/sponsors?search=...`

### Zachování stavu hledání
- Stránka čte `?search=` z URL a předvyplní vyhledávací pole
- Při navigaci zpět se stav hledání zachová

### Zachování aktivní záložky v dashboardu
- Všechny odkazy kódují záložku v `from=` parametru: `from=/dashboard?tab=sponsors`
- Funkce `dashFrom()` generuje zakódovaný `from` URL s `tab` (a `paymentSubTab`)
- Při návratu dashboard čte `tab` a `paymentSubTab` z URL a obnoví záložku

### Řetězová zpětná navigace
- Detail studenta: `document.referrer` + URL parametry
- Flow: Studenti → Sponzoři → Detail → zpět na Sponzoře → zpět na Studenty

---

## 10. Filtrování a vyhledávání

### Stránka Platby (`payments/page.tsx`)
- Dvě záložky: Sponzorské platby / Stravenky
- Textové vyhledávání — jméno studenta, sponzora, poznámky
- Filtr Sponzor — dropdown s unikátními sponzory
- Filtr Typ — dropdown s typy plateb (jen sponzorské)
- Filtry se kombinují (AND logika)
- Tlačítko Zrušit resetuje všechna pole

### Auto-přepočet stravenek
- Při zadání částky nebo změně měny se count přepočítá podle sazby z `VoucherRate`

---

## 11. Návštěvní karty (Visit Cards) — tiskový layout

Soubor: `src/app/reports/visit-cards/print/page.tsx`

Dvoustránkový A4 formulář (výška `calc(297mm - 16mm)`):

| Stránka | Sekce |
|---------|-------|
| 1 | Header, Sponzoři, Základní info, Rodina, Vybavení |
| 2 | Potřeby, Přání, Obecné poznámky (flex-fill) |

- Tisk přes iframe (izolovaný HTML snapshot)
- Poznámkový rámeček na stránce 2 se automaticky roztáhne (`flex: 1`)
- Ceny z číselníků `needTypes`, `wishTypes`, `equipmentTypes`

### Layout vybavení (colgroup + table-fixed)
| Sloupec | Šířka |
|---------|-------|
| Checkbox | 4% |
| Typ | 22% |
| Stav | 11% |
| Poznámky | 63% |

---

## 12. Administrace číselníků

Soubory:
- Hlavní stránka: `src/app/admin/page.tsx` (434 řádků)
- Komponenty: `src/components/admin/` (CodelistSection, VoucherRateSection, TuitionRateSection, BackupSection, types)

### Přidání nové položky s překladem
1. Admin zadá český název
2. Globe tlačítko → otevře EN/SW pole + auto-překlad (MyMemory API)
3. Opětovný klik → skryje a vymaže překladová pole
4. Po "Přidat" se pole automaticky skryjí

### Layout formuláře
```
[ Český název (celá šířka)          ] [ 🌐 ]
[ Cena ]                  ← jen u číselníků s cenou
[ EN: auto-překlad                         ]
[ SW: auto-překlad                         ]
[        + Přidat         |   Zrušit       ]
```

- Globe je **toggle** s vizuálním zvýrazněním (modrý rámeček)
- Globe má `flex-shrink-0`
- Zrušit se zobrazí po začátku vyplňování

### Editace existujících
- Click-to-edit na název (Pencil při hoveru)
- Enter/blur uloží, Escape zruší
- Globe na řádku pro editaci překladů

---

## 13. CSV export

Soubory: `src/lib/csv.ts` (funkce `downloadCSV`)

| Stránka | Export |
|---------|--------|
| Studenti | číslo, jméno, třída, pohlaví, věk, potřeby, sponzoři |
| Sponzoři | jméno, email, telefon, studenti, platby |
| Platby | platby aktivního tabu (sponzorské nebo stravenky) |
| Předpisy | číslo, jméno, třída, částka, zaplaceno, zbývá, stav |

- BOM prefix pro správné kódování v Excelu
- Escapování uvozovek a čárek

---

## 14. Předpisy školného (Tuition)

### Souhrnné karty (3 bubliny)

| Karta | Hlavní hodnota | Pod-text |
|-------|---------------|----------|
| Celkem předepsáno | Částka v CZK | Počet předpisů + roční/půlroční breakdown |
| Celkem zaplaceno | Částka v CZK (zelená) | Počet zaplacených / celkem |
| Celkem zbývá | Částka v CZK (červená) | Počet nezaplacených |

- Roční = `"2026"`, půlroční = `"2026-H1"`

### Tabulka předpisů

| Sloupec | Tříditelný | Popis |
|---------|-----------|-------|
| Student | ano | Jméno + číslo (odkaz na detail) |
| Třída | ano | Třída studenta |
| Částka | ano | Předepsaná částka |
| Zaplaceno | ano | Součet plateb typu školné |
| Zbývá | ano | Předepsáno − zaplaceno |
| Stav | ano | UNPAID / PARTIAL / PAID (barevný badge) |
| Sponzor | ne | Klikatelní sponzoři |
| Typ platby | ne | Typy plateb |
| Poznámky | ne | Volitelné |

---

## 15. Import bankovních výpisů

### Split flow (rozdělení platby)
1. Klik "Rozdělit" → modální okno
2. Nastavení částek, studentů, typů pro každou část
3. Split endpoint vytvoří child řádky (`parentRowId`, status `SPLIT`)
4. Auto-approve: child s `studentId` + `paymentTypeId` → vytvoří platbu
5. Nekompletní child zůstane PARTIAL/NEW → ruční schválení

### VoucherPurchase z importu
- Nastavuje `sponsorId` i `donorName`
- Detekce: `paymentType.name` obsahuje "stravenk" nebo "voucher"
- Počet: z modalu nebo `Math.floor(amount / rate)`

---

## 16. Lokalizace

- **Každý nový text v UI** musí mít klíč ve všech třech jazycích: cs, en, sw
- Hook `useLocale()` pro přístup k překladům
- Čísla formátovat s mezerou jako oddělovačem tisíců: `1 000`
- Měna za číslem: `fmtCurrency(1500, 'KES')` → `1 500 KES`
- Konstanty `CURRENCIES = ['CZK', 'EUR', 'USD', 'KES']`

---

## 17. Formátování

| Typ | Formát | Příklad |
|-----|--------|---------|
| Tisíce | Mezera jako oddělovač | 1 234 567 |
| Měna | Číslo + kód za | 1 500 KES |
| Chybějící hodnota | `—` (pomlčka) | — |
| Status badge | `rounded-full` | PAID / UNPAID / PARTIAL |

---

## 18. Prázdné stavy

Konzistentní zpráva přes lokalizační klíč:
```tsx
<p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
    {t('app.noData')}
</p>
```
- Používat `t('app.noData')`, ne hardcoded text
- V tabulkách: `<td colSpan={...} className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">`

---

## 19. Potvrzení destruktivních akcí

- Standardní: `window.confirm('Opravdu smazat?')` před API voláním
- Kritické: textový input s klíčovým slovem + disabled tlačítko
