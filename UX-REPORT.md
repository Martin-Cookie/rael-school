# Rael School – UX Report – celá aplikace – 2026-04-21

> Analyzováno: 2026-04-21
> Rozsah: celá aplikace (Dashboard, Studenti, Sponzoři, Platby, Import, Tuition, Třídy, Reports, Admin, Login)
> Metoda: 6 expertních pohledů (Běžný uživatel, Business analytik, UI/UX designer, Performance, Error recovery, Data quality)

---

## Souhrn

| Pohled | Kritické | Důležité | Drobné |
|--------|:-:|:-:|:-:|
| Běžný uživatel | 2 | 6 | 4 |
| Business analytik | 1 | 5 | 2 |
| UI/UX designer | 1 | 6 | 5 |
| Performance analytik | 1 | 4 | 3 |
| Error recovery | 4 | 5 | 2 |
| Data quality | 3 | 6 | 3 |
| **Celkem** | **12** | **32** | **19** |

---

## Nálezy a návrhy

### Globální / napříč aplikací

#### Nález #G1: Nenaznačené neuložené změny (dirty state) v detailu studenta
- **Severity:** KRITICKÉ
- **Pohled:** Error recovery, Běžný uživatel
- **Problém:** V `students/[id]/page.tsx` v edit módu (záložky Osobní údaje + Vybavení) se data načtou do `editData` a `editEquipment`, ale při kliknutí na jinou záložku, odkaz v sidebaru, nebo tlačítko Zpět se editace tiše zruší bez varování — uživatel ztratí všechny vyplněné údaje bez upozornění. Žádný `beforeunload` listener, žádný „Máte neuložené změny" dialog.
- **Dopad:** Manažer/dobrovolník vyplní 10 polí v detailu studenta, klikne na jinou záložku a o vše přijde. V 9 záložkovém detailu je to velmi pravděpodobný scénář.
- **Návrh:** Přidat `isDirty` detekci (`JSON.stringify(editData) !== JSON.stringify(student)`) a:
  1. Blokovat přechod záložky/navigaci s confirm dialogem
  2. `beforeunload` listener pro zavření taby
  3. Vizuální indikátor neuložených změn (tečka u tlačítka Uložit, žlutý rámeček hero-headru)
- **Kde v kódu:** `src/app/students/[id]/page.tsx:93-98`, `:486-497` (tlačítka edit/save), `:520-530` (tab switcher bez blokace)
- **Mockup:**
  ```
  Současný stav:
  ┌─────────────────────────────────────────────┐
  │ [Osobní] [Vybavení] [Potřeby] ...           │
  │ (uživatel v edit módu, klikne Potřeby)      │
  │ → změny TICHO zahozeny                      │
  └─────────────────────────────────────────────┘

  Navrhovaný stav:
  ┌─────────────────────────────────────────────┐
  │ [Osobní •] [Vybavení] [Potřeby] ...         │
  │ ( • = neuložené změny)                      │
  │                                             │
  │ Klik na jinou záložku:                      │
  │ ┌────────────────────────────────────────┐ │
  │ │ Neuložené změny                        │ │
  │ │ Chcete opustit editaci bez uložení?    │ │
  │ │ [Zpět k editaci] [Zahodit změny]       │ │
  │ └────────────────────────────────────────┘ │
  └─────────────────────────────────────────────┘
  ```

#### Nález #G2: `window.confirm()` místo stylizovaného dialogu
- **Severity:** DŮLEŽITÉ
- **Pohled:** UI/UX designer, Běžný uživatel
- **Problém:** Destruktivní akce (smazání studenta, platby, potřeby, vybavení, stravenky, sponzora) používají nativní `window.confirm(t('app.confirmDelete'))` — generická zpráva „Opravdu chcete smazat?" bez kontextu (co mazu, je to vratné, má to důsledky). Nativní dialog je nekonzistentní s designem aplikace a na některých prohlížečích jde jen zrušit, ne potvrdit klávesou.
- **Dopad:** Uživatel nemá jistotu, co maže. U mazání plateb (nevratné, ovlivní součty) je riziko ztráty dat vysoké.
- **Návrh:** Vytvořit sdílenou komponentu `<ConfirmDialog>` s:
  - Barevně odlišený danger vs. info
  - Konkrétní text („Smazat platbu 3 700 CZK od Jan Novák z 15.3.2026?")
  - Focus trap + Escape to close
  - Pro kritické akce (smazání studenta, sponzora, platby) textový input „Napište SMAZAT pro potvrzení"
- **Kde v kódu:** 18+ výskytů `window.confirm` v `students/[id]/page.tsx:231,252,263,275,290,307,322`, `payments/page.tsx:260`, `sponsors/page.tsx:133`, `admin/page.tsx:114,387,421`
- **Mockup:**
  ```
  Současný stav:
  ╔════════════════════════════╗
  ║ localhost:3000 says        ║   ← nativní OS dialog
  ║ Opravdu chcete smazat?     ║
  ║     [Cancel] [OK]          ║
  ╚════════════════════════════╝

  Navrhovaný stav:
  ┌────────────────────────────────────────────┐
  │ ⚠ Smazat platbu                             │
  │                                             │
  │ Chystáte se smazat platbu:                  │
  │   3 700 CZK · Školné                        │
  │   Jan Novák → Marie Svobodová              │
  │   15. 3. 2026                               │
  │                                             │
  │ Tato akce je NEVRATNÁ a ovlivní součty      │
  │ předpisů školného.                          │
  │                                             │
  │          [Zrušit]  [Smazat]                │
  └────────────────────────────────────────────┘
  ```

#### Nález #G3: Chybí univerzální undo / audit visibility
- **Severity:** DŮLEŽITÉ
- **Pohled:** Error recovery, Business analytik
- **Problém:** AuditLog existuje, ale jen admin ho vidí v `/admin`. Běžný uživatel po nechtěně smazané platbě nemá žádnou cestu „Vrátit zpět" (toasty mizí po pár sekundách, jsou jen „success/error" bez undo).
- **Dopad:** Chybný klik = volání administrátora + manuální obnovení z DB zálohy.
- **Návrh:** Přidat k toastu u destruktivních akcí tlačítko „Vrátit zpět" (5-10 s okno), které zavolá nový `/api/undo` endpoint s předchozím snapshotem, nebo jen soft-delete (`deletedAt`) s obnovením v auditu.
- **Kde v kódu:** `src/hooks/useToast.ts`, všechny delete handlery

#### Nález #G4: Nekonzistentní style dark mode napříč stránkami
- **Severity:** DŮLEŽITÉ
- **Pohled:** UI/UX designer
- **Problém:** Některé prvky nemají dark mode varianty nebo je mají nekonzistentní:
  - `sponsors/page.tsx:209,229,287,296,332-333` — hardcoded `text-gray-900`, `text-gray-600` bez dark
  - `classes/page.tsx:61-62,91-93,102,108` — kompletně bez `dark:` tříd
  - `reports/page.tsx:194-256` — summary karty bez dark mode
  - `reports/visit-cards/page.tsx:173+` — téměř bez dark mode
  - `login/page.tsx:84-86,152,155-158` — demo credentials blok má dark, ale hlavní card ne
- **Dopad:** V dark mode vypadají tyto stránky rozbité (bílé karty na černém pozadí, černý text na černém).
- **Návrh:** Audit všech stránek, doplnit `dark:` varianty podle `docs/UI_GUIDE.md:146-167`. Vytvořit ESLint rule nebo runtime test v dark mode.
- **Kde v kódu:** viz výše

#### Nález #G5: Chybí keyboard shortcuts pro časté akce
- **Severity:** DŮLEŽITÉ
- **Pohled:** Performance analytik
- **Problém:** Časté akce (přidat studenta, vyhledávání, přepnutí záložky) nemají žádné klávesové zkratky. Power-user musí vždy klikat myší.
- **Dopad:** Při zpracování 148 studentů je to zbytečně pomalé.
- **Návrh:** Přidat standardní shortcuts:
  - `/` nebo `Ctrl+K` — focus search input (podobně jako GitHub, Linear)
  - `n` — nový záznam (nový student/sponzor/platba)
  - `Esc` — zavřít modal/formulář
  - `Ctrl+S` — uložit detail studenta
  - `g s` / `g p` / `g d` — go to students/payments/dashboard
- **Kde v kódu:** napříč aplikací

#### Nález #G6: Žádná globální search (cross-entity vyhledávání)
- **Severity:** DŮLEŽITÉ
- **Pohled:** Performance analytik, Běžný uživatel
- **Problém:** Uživatel, který hledá „Novák", musí vědět, jestli je to sponzor nebo student. Každá stránka má svůj search. Neexistuje sjednocený top-bar search.
- **Dopad:** Pro někoho, kdo chce najít platbu nebo import s určitou jménem/částkou, je nutné otevřít 3-4 stránky.
- **Návrh:** Cmd/Ctrl+K globální palette — výsledky rozdělené do sekcí (Studenti, Sponzoři, Platby, Třídy). API `/api/search?q=...`.

#### Nález #G7: `document.referrer` místo state-based back navigation
- **Severity:** DROBNÉ
- **Pohled:** Error recovery, UI/UX designer
- **Problém:** `students/[id]/page.tsx:141-146` čte `from` z URL parametrů, ale pokud uživatel otevře detail přímo přes URL (sdílený odkaz), `backUrl` zůstane `/students`. Také pokud se používá `router.push` a pak refresh, `referrer` je prázdný.
- **Návrh:** Použít `router.back()` kdykoli je to možné (na základě browser history), `from=` jen jako fallback.

#### Nález #G8: Loading states nekonzistentní
- **Severity:** DROBNÉ
- **Pohled:** UI/UX designer
- **Problém:** Všechny stránky mají spinner `border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin`. Žádné skeleton loading, žádný optimistic update. Uživatel čeká stejný způsob vždy, ať je to 100ms nebo 3s.
- **Návrh:** Pro tabulky skeleton s 5-10 ghost rows. Pro platby/tuition optimistic update (přidat řádek hned, pak potvrdit z API).

---

### Dashboard (`/dashboard`)

#### Nález #D1: Přehlcený dashboard — 6 záložek bez jasné hierarchie
- **Severity:** DŮLEŽITÉ
- **Pohled:** UI/UX designer, Běžný uživatel
- **Problém:** Dashboard má 6 karet = 6 záložek + 2 sub-záložky v Platbách. Vše je na stejné úrovni. Nejčastější úkoly (poslední platby, aktuální neuspokojené potřeby) nejsou viditelné bez kliknutí.
- **Dopad:** Manažer přijde na dashboard a nevidí „Co je nového", „Co mě čeká dnes". Musí kliknout, což popírá smysl dashboardu.
- **Návrh:** Horní „Alerts" sekce (3-5 karet):
  - Nezpracované importy (N řádků čeká na schválení)
  - Neuspokojené kritické potřeby (TOP 5)
  - Studenti bez sponzora (8 z CLAUDE.md)
  - Nezaplacené předpisy školného pro aktuální období
  - Nedávné platby (5 posledních)
  Pak až záložky s tabulkami.
- **Kde v kódu:** `src/app/dashboard/page.tsx:132-139`

#### Nález #D2: Karta „Platby" má prakticky nečitelný value
- **Severity:** DROBNÉ
- **Pohled:** UI/UX designer
- **Problém:** `paymentSummary = Object.keys(spByCur).sort().map(...).join(' | ')` produkuje např. „3 000 CZK | 120 EUR | 50 USD | 5 000 KES" — na malé kartě v gridu (2 sloupce na mobilu) se to přetéká/zalamuje.
- **Návrh:** Zobrazit jen hlavní měnu (podle konfigurace lokality, default CZK) + link „… další měny →" v hover tooltipu nebo pod-textu.
- **Kde v kódu:** `src/app/dashboard/page.tsx:119-125,135`

#### Nález #D3: Klikací karta třídy na dashboardu nevrací jednotně
- **Severity:** DROBNÉ
- **Pohled:** Běžný uživatel
- **Problém:** V dashboardu klikem na název třídy v tabulce Studenti jdu na detail třídy, tlačítko Zpět vrátí zpět na záložku Studenti (přes `prevTabRef`). Ale na stránce `/classes` je podobná mechanika přes `fromPage` URL param, takže mezi dashboardem a `/classes` dochází k nekonzistenci.
- **Návrh:** Sjednotit na jedno řešení (URL state).
- **Kde v kódu:** `dashboard/page.tsx:69,173,312`; `classes/page.tsx:17,32-33,104`

---

### Studenti (`/students`, `/students/[id]`, `/students/new`)

#### Nález #S1: 10 záložek v detailu studenta je přehnané
- **Severity:** DŮLEŽITÉ
- **Pohled:** UI/UX designer, Běžný uživatel
- **Problém:** Osobní, Sponzoři, Vybavení, Potřeby, Přání, Stravenky, Platby, Školné, Zdraví, Fotografie — 10 záložek. Na mobilu se roztáhne přes 3 řádky (wrap). Terminologie překrývá se (Potřeby vs Přání — rozdíl není intuitivní).
- **Dopad:** Pomalá orientace, nutnost scrollu nebo taby-overflow.
- **Návrh:** Seskupit do 4 sekcí:
  - **Profil** (osobní, rodina, zdraví, fotografie)
  - **Finance** (sponzoři, platby, školné, stravenky)
  - **Materiální pomoc** (vybavení, potřeby, přání)
  - **Historie** (audit/timeline všech změn)
  Pak v každé sekci pod-navigace.
- **Kde v kódu:** `src/app/students/[id]/page.tsx:413-424`
- **Mockup:**
  ```
  Současný stav:
  ┌─────────────────────────────────────────────────┐
  │ [Os] [Sp] [Vyb] [Pot] [Pří] [Str] [Pla] [Ško] │
  │ [Zdr] [Fot]  ← 10 tabů, na mobilu wrap         │
  └─────────────────────────────────────────────────┘

  Navrhovaný stav:
  ┌─────────────────────────────────────────────────┐
  │ [Profil]  [Finance]  [Pomoc]  [Historie]       │
  │                                                 │
  │ Profil ▸ Osobní | Rodina | Zdraví | Fotografie │
  └─────────────────────────────────────────────────┘
  ```

#### Nález #S2: `/students/new` formulář nemá validaci emailu, datumu
- **Severity:** KRITICKÉ
- **Pohled:** Data quality
- **Problém:** `students/new/page.tsx` akceptuje jakýkoli vstup:
  - `dateOfBirth` bez validace (může být v budoucnosti, nelogické → 1899)
  - `firstName/lastName` nejsou trim()-nuté, můžou mít leading space
  - žádná min/max délka
  - žádná kontrola duplicity (dva studenti stejného jména + DOB)
- **Dopad:** DB se plní špinavými daty. Při importu plateb match na jméno selhává kvůli whitespace.
- **Návrh:** Zod schéma, trim, validace rozsahu DOB (`>= 1950`, `<= today - 2`), upozornění na duplicitu.
- **Kde v kódu:** `src/app/students/new/page.tsx:24-47,73-76`

#### Nález #S3: `/students/new` neobsahuje jednoduchou cestu k přidání sponzora/potřeby
- **Severity:** DŮLEŽITÉ
- **Pohled:** Business analytik
- **Problém:** Po vytvoření nového studenta je uživatel přesměrován na `/students/[id]` v detail view (read mode). Pokud chce ihned přiřadit sponzora nebo potřeby, musí kliknout na záložku, kliknout „Přidat", vyplnit další formulář. Není tu wizard.
- **Návrh:** Po vytvoření studenta automaticky přepnout na edit mode s inline add buttons pro sponzora a potřeby, nebo vícekroková tvorba (1. základní údaje → 2. rodina → 3. sponzor → 4. potřeby).
- **Kde v kódu:** `src/app/students/new/page.tsx:41`

#### Nález #S4: Nekonzistentní back navigace v seznamu studentů
- **Severity:** DROBNÉ
- **Pohled:** UI/UX designer
- **Problém:** `/students` nemá tlačítko Zpět. Po přechodu ze sponzora zpět si zachová search parameter, ale když jdu přímo, je to bez kontextu.
- **Návrh:** Breadcrumb nahoře (Dashboard › Studenti › Marie Svobodová).

#### Nález #S5: Hledání studentů nemá fuzzy/diakritiku-aware match
- **Severity:** DROBNÉ
- **Pohled:** Data quality, Performance analytik
- **Problém:** API `/api/students?search=...` pravděpodobně dělá přesné `contains` match. Uživatel hledající „Koci" nenajde „Kočí" (nebo naopak).
- **Návrh:** Server-side diakritiku-insensitive search (normalizace NFD), a/nebo na client-straně fuzzy match (fuse.js).
- **Kde v kódu:** `src/app/students/page.tsx:22-28`

#### Nález #S6: Chybí vizuální indikátor „tento student nemá sponzora"
- **Severity:** DŮLEŽITÉ
- **Pohled:** Business analytik, Běžný uživatel
- **Problém:** 8 studentů podle CLAUDE.md nemá sponzora. V tabulce studentů je to vidět jen jako „0" ve sloupci Sponzoři. Žádný filtr „jen bez sponzora", žádný vizuální highlight.
- **Návrh:** Filtr „Bez sponzora" + červený dot u řádku. V reports i dashboardu karta „Studenti bez sponzora (8)" s odkazem.
- **Kde v kódu:** `src/app/students/page.tsx:101-110`

#### Nález #S7: Potvrzení uložení změn přes modal je frikční
- **Severity:** DROBNÉ
- **Pohled:** Performance analytik
- **Problém:** `students/[id]/page.tsx:439-450` — po kliknutí na Save se otevře confirm dialog „Uložit?". To je dvoj-klik pro jednoduchou akci, zbytečný.
- **Návrh:** Uložit rovnou. Místo toho zobrazit toast „Uloženo — vrátit zpět".
- **Kde v kódu:** `src/app/students/[id]/page.tsx:490,197-206,439-450`

---

### Sponzoři (`/sponsors`)

#### Nález #SP1: Inline edit v tabulce koliduje s hover actions
- **Severity:** DROBNÉ
- **Pohled:** UI/UX designer
- **Problém:** Řádkové akce (Pencil, UserX) se zobrazují jen na hover (`opacity-0 group-hover:opacity-100`), ale na touch devices uživatel nezobrazí hover. Při přechodu do edit režimu řádek změní layout a uživateli se náhle změní vše.
- **Návrh:** Na mobilu zobrazit akce vždy (nebo přes long-press), na desktopu hover OK. Nebo přidat „Upravit" button na konec řádku stále viditelný.
- **Kde v kódu:** `src/app/sponsors/page.tsx:363-378`

#### Nález #SP2: Deaktivovaný sponzor zůstává v seznamu bez filtru
- **Severity:** DŮLEŽITÉ
- **Pohled:** UI/UX designer, Business analytik
- **Problém:** `includeInactive=true` vrací všechny. Inactive má jen lehký růžový pozadí (`bg-red-50/50`) + badge. Uživatel hledající aktivní sponzory je musí vyfiltrovat sám.
- **Návrh:** Toggle „Zobrazit neaktivní" nebo dropdown „Všichni / Aktivní / Neaktivní" default Aktivní.
- **Kde v kódu:** `src/app/sponsors/page.tsx:80`

#### Nález #SP3: Žádná validace emailu ve frontendu
- **Severity:** DŮLEŽITÉ
- **Pohled:** Data quality
- **Problém:** `type="email"` u inputu zajistí HTML5 validaci, ale tlačítko Save volá API, které je source of truth. Přesto před odesláním by frontend mohl zkontrolovat @.
- **Návrh:** Vlastní `validateEmail()` funkce + vizuální feedback (červený border), a kontrola duplicity (GET /api/sponsors?email=...) před POST.
- **Kde v kódu:** `src/app/sponsors/page.tsx:87-108`

#### Nález #SP4: Sponzoři řazení podle počtu studentů není viditelné kolik jich platí
- **Severity:** DROBNÉ
- **Pohled:** Business analytik
- **Problém:** Sloupec „Studenti" ukazuje počet přiřazených, ale ne kolik z nich je aktivních. Kolik sponzor zaplatil je v jiném sloupci.
- **Návrh:** Sloučit do „Podporuje: 3 aktivní (celkem 4) → 12 000 CZK/rok".

---

### Platby (`/payments`)

#### Nález #P1: Přidání platby — overwhelming form s podmíněnými poli
- **Severity:** DŮLEŽITÉ
- **Pohled:** UI/UX designer, Běžný uživatel
- **Problém:** Add form má 8 polí v gridu + conditional „count" pole jen pro voucher typ. Uživatel ne vždy chápe, že výběr typu platby přepíná zobrazení dalšího pole.
- **Dopad:** Confused state — uživatel vyplní amount, změní typ na Stravenka, a pole „count" se objeví prázdné (i když je pre-filled z kalkulace).
- **Návrh:** Dvoukrokové:
  1. „Co přidávám? [Sponzorská platba] [Nákup stravenek]"
  2. Relevantní form podle typu
  Nebo aspoň výrazný label + fallback help text „Pro stravenky zadejte počet kusů".
- **Kde v kódu:** `src/app/payments/page.tsx:415-472`

#### Nález #P2: Filtry se neukládají v URL
- **Severity:** DŮLEŽITÉ
- **Pohled:** Performance analytik, Běžný uživatel
- **Problém:** Search, filterType, filterSponsor nejsou v URL query params. Po přechodu na detail a zpět se ztratí (narozdíl od `/sponsors?search=` stavu).
- **Návrh:** `useSearchParams` + `router.push` s filtry v URL.
- **Kde v kódu:** `src/app/payments/page.tsx:73,97-98`

#### Nález #P3: Inline editace řádku prezentuje 7 inputs najednou — chaos
- **Severity:** DŮLEŽITÉ
- **Pohled:** UI/UX designer
- **Problém:** Klik na Pencil → řádek se změní na 7 inline inputs v tabulkovém formátu. Na menším displayi to pumpe, inputy narážejí na sebe, currency dropdown má jen `w-16`. Mnoho zaráželi, špatná přehlednost.
- **Návrh:** Editovat v modálu (jako Split modal) nebo v inline panelu pod řádkem (expand).
- **Kde v kódu:** `src/app/payments/page.tsx:521-575`

#### Nález #P4: Mazání platby neukazuje důsledky
- **Severity:** KRITICKÉ
- **Pohled:** Data quality, Error recovery
- **Problém:** Smazání platby (`deletePayment` line 259) má `confirm(t('app.confirmDelete'))` — tedy generické „Smazat?". Ale tato akce:
  1. Přepočítá stav předpisu školného (PAID→PARTIAL→UNPAID)
  2. Odstraní záznam navždy
  3. Změní sponzorovu total paid částku
  Nic z toho se uživateli nesděluje.
- **Dopad:** Uživatel smaže platbu, předpis se přepne z PAID na UNPAID, a zákazník má problém.
- **Návrh:** Confirm dialog s detaily:
  ```
  Smazat platbu 3 700 CZK od Jan Novák?
  Důsledky:
  - Předpis Marie Svobodová 2026 přejde z PAID na PARTIAL (zbývá 3 700)
  - Sponzor Jan Novák: celkem zaplaceno -3 700 (nově 15 300 CZK)
  [Zrušit] [Smazat platbu]
  ```
- **Kde v kódu:** `src/app/payments/page.tsx:259-274`

#### Nález #P5: Auto-výběr sponzora při jednom studentu bez možnosti vypnout
- **Severity:** DROBNÉ
- **Pohled:** Data quality
- **Problém:** `matched.length === 1 ? matched[0].id : ''` — pokud má student jen jednoho sponzora, automaticky se vybere. Co když jde o platbu od jiného sponzora (změna, nepřiřazený)?
- **Návrh:** Nabídnout i v dropdownu „Jiný sponzor…" s autosuggest.
- **Kde v kódu:** `src/app/payments/page.tsx:419-421`

---

### Import bankovních výpisů (`/payments/import/[id]`)

#### Nález #I1: Split modal — chybí přednastavení počtu částí
- **Severity:** DŮLEŽITÉ
- **Pohled:** Business analytik
- **Problém:** Split modal začíná vždy s 2 částmi 50/50. Ale typický use case je: 1 bankovní platba = 1 rodič, pokrývá několik sourozenců (3-4 děti). Uživatel musí klikat „+ Přidat" 2-3x.
- **Návrh:** Přidat „Auto-split by siblings" — pokud je v `message` nebo `senderName` klíč rodinné skupiny (rodič má sourozence v DB), předvyplnit.
- **Kde v kódu:** `src/app/payments/import/[id]/page.tsx:267-273`

#### Nález #I2: Stav řádku NEW vs PARTIAL vs MATCHED je nejasný
- **Severity:** DŮLEŽITÉ
- **Pohled:** Běžný uživatel, UI/UX designer
- **Problém:** 7 statusů (NEW, MATCHED, PARTIAL, APPROVED, REJECTED, DUPLICATE, SPLIT) + 4 confidence (HIGH, MEDIUM, LOW, NONE). Bez školení uživatel neví, který stav znamená „mohu schválit".
- **Návrh:** Tooltip u každého stavu + legenda nad tabulkou. Sjednotit filter-buttony se stav badges (teď v filter-buttons je `stats.matched` color coding jiný).
- **Kde v kódu:** `src/app/payments/import/[id]/page.tsx:69-84,411-419`

#### Nález #I3: Import celá stránka nemá sticky header/thead
- **Severity:** DROBNÉ
- **Pohled:** UI/UX designer
- **Problém:** Na rozdíl od Students/Sponsors/Payments tady chybí sticky hlavička. Při scrollu přes 500+ řádků uživatel ztratí header.
- **Návrh:** Přidat `useStickyTop` hook.
- **Kde v kódu:** `src/app/payments/import/[id]/page.tsx:515-538`

#### Nález #I4: Approve / Reject bez náhledu důsledků
- **Severity:** KRITICKÉ
- **Pohled:** Error recovery, Data quality
- **Problém:** Tlačítko „Approve Selected" (100 řádků) rovnou vytvoří 100 plateb v DB. Žádný preview „Toto vytvoří: 80 SponsorPayment, 20 VoucherPurchase, celkem 340 000 KES". Žádná možnost vrátit zpět bulk operaci.
- **Dopad:** Omyl v 1 řádku = 100 invalid plateb. Musí se ručně mazat.
- **Návrh:** Preview modal před approve — tabulka co se vytvoří, s možností zaškrtnout jednotlivě. Možnost bulk undo 5 minut po potvrzení.
- **Kde v kódu:** `src/app/payments/import/[id]/page.tsx:218-240`

#### Nález #I5: Tooltip s match notes ukazuje podrobnosti, ale nejsou na první pohled viditelné
- **Severity:** DROBNÉ
- **Pohled:** Běžný uživatel
- **Problém:** Info ikona je jen pokud `row.matchNotes` existuje, ale match notes jsou často důležité pro rozhodnutí schválit/zamítnout. Skryté pod extra kliknutím.
- **Návrh:** Match notes zobrazit jako drobný text pod senderName, nebo expandable.
- **Kde v kódu:** `src/app/payments/import/[id]/page.tsx:690-708`

#### Nález #I6: Duplikátní detekce postrádá varování na importu
- **Severity:** KRITICKÉ
- **Pohled:** Data quality
- **Problém:** Upload CSV s totožnými transakcemi jako předchozí import → v existujícím flow se řádky označí status=DUPLICATE. Ale kdyby něco selhalo (jiný fileName, jiná variabilní symboly), duplicity nebyly by detekovány.
- **Návrh:** Před uploadem preview: „Nalezli jsme 5 transakcí, které pravděpodobně již existují." + možnost je vynechat.
- **Kde v kódu:** API endpoint `/api/payment-imports` (pro detailní analýzu není v scope toho reportu, ale UI chybí)

---

### Tuition / Předpisy školného (`/tuition`)

#### Nález #T1: Generate panel funguje, ale nejasné, co se stane s duplicitami
- **Severity:** DŮLEŽITÉ
- **Pohled:** Data quality, Běžný uživatel
- **Problém:** Tlačítko Generovat spustí POST `/api/tuition-charges` pro vybrané studenty + období. CLAUDE.md říká „duplikáty se přeskakují". Ale UI uživatele neupozorní, pokud např. 30 z 50 vybraných studentů už má předpis.
- **Návrh:** Preview modal „Z 50 vybraných studentů: 30 už má předpis (přeskočeno), 20 nových bude vytvořeno. Pokračovat?"
- **Kde v kódu:** `src/app/tuition/page.tsx:140-160`

#### Nález #T2: Filter period je jen dropdown s 3 roky
- **Severity:** DROBNÉ
- **Pohled:** Běžný uživatel
- **Problém:** Dropdown roků `[currentYear - 1, currentYear, currentYear + 1]`. Co když chci historii 2022-2024? Nejsou tam.
- **Návrh:** Rozšířit rozsah na 5 let zpět, 2 roky dopředu. Nebo zobrazit jen roky, kde existují předpisy (dynamicky).
- **Kde v kódu:** `src/app/tuition/page.tsx:207-208`

#### Nález #T3: Souhrnné karty používají vždy CZK
- **Severity:** DŮLEŽITÉ
- **Pohled:** Data quality
- **Problém:** `summary.totalCharged` se zobrazí jako `fmtCurrency(summary.totalCharged, 'CZK')` natvrdo, ale předpisy můžou být v různých měnách (voucher rates jsou per měna). V multi-currency kontextu je to zavádějící.
- **Návrh:** Zobrazit per-currency breakdown jako na dashboardu.
- **Kde v kódu:** `src/app/tuition/page.tsx:406,415,422`

#### Nález #T4: Nelze mazat individuální předpis
- **Severity:** DŮLEŽITÉ
- **Pohled:** Error recovery
- **Problém:** Tabulka předpisů nemá action buttons (Pencil, Trash). Pokud je předpis vytvořen omylem, uživatel ho nemůže odstranit z UI.
- **Návrh:** Přidat Pencil/Trash ikonu do sloupce akcí.
- **Kde v kódu:** `src/app/tuition/page.tsx:443-453`

#### Nález #T5: Generate panel — checkbox „select all" při class filter nepracuje s filterem
- **Severity:** DROBNÉ
- **Pohled:** Business analytik
- **Problém:** Při zvoleném `genClassFilter='Grade 5'` zobrazí se jen studenti třídy 5. „Select All" checkbox ale zaškrtne všechny v `genFiltered` (i ty, co jsou po search). Je to OK, ale uživatel si možná myslel, že „Select All" = všichni studenti bez ohledu na filter.
- **Návrh:** Label přejmenovat na „Vybrat vše z výběru" nebo zobrazit „Vybrat vše (32 v tomto filtru)".

---

### Třídy (`/classes`)

#### Nález #C1: Karta třídy neukazuje kolik studentů má potřeby/chybí sponzory
- **Severity:** DROBNÉ
- **Pohled:** Business analytik
- **Problém:** Karta: název + počet + M/F breakdown. Nic o kvalitě třídy (potřeby, platby, sponzorství).
- **Návrh:** Přidat drobný indikátor: „3 bez sponzora | 5 potřeb | 2 800 KES dluh".
- **Kde v kódu:** `src/app/classes/page.tsx:83-97`

#### Nález #C2: Stránka používá `/api/dashboard` místo vlastního endpointu
- **Severity:** DROBNÉ
- **Pohled:** Performance analytik
- **Problém:** Fetches all dashboard data just to extract class names. Zbytečná data over wire.
- **Návrh:** Dedikovaný `/api/classes` endpoint vracející jen třídy + agregované counts.
- **Kde v kódu:** `src/app/classes/page.tsx:36`

---

### Reports (`/reports`, `/reports/visit-cards`)

#### Nález #R1: Accordion sekce se zavírají při přepnutí, dat se načte znovu
- **Severity:** DROBNÉ
- **Pohled:** Performance analytik
- **Problém:** Sekce se rozklopí jen jedna (`openSection` state). Komponenty ale nejsou lazy-loaded, takže data již jsou v state. OK z pohledu UX, ale multiple accordions open by bylo lepší pro srovnání.
- **Návrh:** Povolit multiple open (array state místo single string).
- **Kde v kódu:** `src/app/reports/page.tsx:56,277-516`

#### Nález #R2: Visit Cards — CSV upload formát není dokumentovaný
- **Severity:** DŮLEŽITÉ
- **Pohled:** Běžný uživatel, Data quality
- **Problém:** Tlačítko „Nahrát CSV" akceptuje libovolný formát (lastName, firstName nebo firstName lastName v jednom cell), ale nikde není instrukce, co uploadnout. Uživatel s excelovým seznamem neví, jak formátovat.
- **Návrh:** Pod tlačítkem link „Šablona CSV" ke stažení + tooltip „Podporované formáty: lastName;firstName, nebo jméno přímo (John Doe)".
- **Kde v kódu:** `src/app/reports/visit-cards/page.tsx:222-227`

#### Nález #R3: Visit Cards — CSV match result zůstává viditelný, ale nejasný
- **Severity:** DROBNÉ
- **Pohled:** UI/UX designer
- **Problém:** Po uploadu se zobrazí "Matched: 25 | Not found: 3". Ale tento panel nemá dismiss tlačítko, zůstává, dokud neudělám další akci.
- **Návrh:** Přidat X tlačítko + timeout 30s.
- **Kde v kódu:** `src/app/reports/visit-cards/page.tsx:248-265`

#### Nález #R4: Reports stránka nemá filter by period
- **Severity:** DŮLEŽITÉ
- **Pohled:** Business analytik
- **Problém:** Reports ukazuje lifetime data (celá historie). Nelze filtrovat „platby v roce 2025" pro srovnání s 2026.
- **Návrh:** Global period filter (rok + měsíc) v horní části.

#### Nález #R5: Export statistik do CSV chybí
- **Severity:** DROBNÉ
- **Pohled:** Business analytik
- **Problém:** Studenti/Sponzoři/Platby mají CSV export, Reports ne. Pro reporting pro nadaci/sponzory by se hodil.
- **Návrh:** Přidat „Exportovat report (CSV/PDF)" tlačítko.

---

### Admin (`/admin`)

#### Nález #A1: 6 číselníků + Voucher/Tuition rates + Backup + Audit je jedna dlouhá stránka
- **Severity:** DŮLEŽITÉ
- **Pohled:** UI/UX designer
- **Problém:** Admin stránka scrolluje donekonečna. 6 číselníkových karet + 4 další sekce. Žádná TOC, žádné sticky sidebar pro navigaci.
- **Návrh:** Rozdělit na záložky v admin: Číselníky / Sazby / Zálohy / Audit. Každá tab = jedna sekce.
- **Kde v kódu:** `src/app/admin/page.tsx:185-438`

#### Nález #A2: Codelist section — delete bez varování že je item použit
- **Severity:** KRITICKÉ
- **Pohled:** Data quality
- **Problém:** Smazání typu platby (např. „Školné") přes API provede cascade/set null na SponsorPayment. Uživatel nemá varování „Tento typ je použit v 45 platbách". Po smazání jsou platby osiřelé.
- **Návrh:** Před delete API call: GET usage count. Pokud >0, dialog „Tento typ je použit v 45 platbách. Co s nimi? [Smazat všechny] [Přepnout na typ…] [Zrušit]".
- **Kde v kódu:** `src/app/admin/page.tsx:113-119` + API endpointy

#### Nález #A3: Translate endpoint volá externí službu bez caching
- **Severity:** DROBNÉ
- **Pohled:** Performance analytik
- **Problém:** MyMemory API má limit. Volá se při každém kliknutí na Globe, žádný cache.
- **Návrh:** Cache překladů v admin DB (AuditLog už je). Před API call check cache.
- **Kde v kódu:** `src/app/admin/page.tsx:78-93` + `/api/admin/translate`

#### Nález #A4: Voucher rate form — validace ručně
- **Severity:** DROBNÉ
- **Pohled:** Data quality
- **Problém:** `!newVRCurrency.trim() || !newVRRate || parseFloat(newVRRate) <= 0` — silent fail, uživatel nevidí proč se nic neděje.
- **Návrh:** Disabled button dokud není form validní + error message.
- **Kde v kódu:** `src/app/admin/page.tsx:376`

---

### Login (`/login`)

#### Nález #L1: Demo credentials viditelné v production
- **Severity:** KRITICKÉ
- **Pohled:** Data quality (security)
- **Problém:** Každý kdo otevře `/login` vidí hesla Admin/Manager/Sponsor/Volunteer. OK v demo, ale nutno v produkci skrýt.
- **Návrh:** Conditional render `if (process.env.NODE_ENV !== 'production')`.
- **Kde v kódu:** `src/app/login/page.tsx:152-160`

#### Nález #L2: Password field nemá show/hide pro mobilní keyboard
- **Severity:** DROBNÉ
- **Pohled:** UI/UX designer
- **Problém:** Show/hide tlačítko existuje, ale pro uživatele s malým displayem může být užitečnější rovnou zobrazit poslední znak (jako Android/iOS standard).
- **Návrh:** Existujícím řešením OK, ale add autocomplete="current-password" attribute pro password managery.
- **Kde v kódu:** `src/app/login/page.tsx:110-125`

#### Nález #L3: Error message generic „Invalid email or password"
- **Severity:** DROBNÉ
- **Pohled:** Error recovery
- **Problém:** Běžný i18n security best-practice je nevyzradit, jestli je chyba v emailu nebo hesle. OK. Ale 3 chybné pokusy → zobrazit nápovědu „Zapomněli jste heslo? Kontaktujte admina".
- **Návrh:** Počítat pokusy klientský, zobrazit po 3. pokusu contact info.

---

## Top 5 doporučení (podle dopadu × složitosti)

| # | Návrh | Dopad | Složitost | Priorita |
|---|-------|-------|-----------|----------|
| 1 | Dirty state + unsaved changes dialog v detailu studenta (#G1) | Vysoký — prevence ztráty práce | Nízká (1 custom hook) | HNED |
| 2 | Stylizovaný ConfirmDialog s detaily nahradí window.confirm (#G2) | Vysoký — snížení omylů při mazání | Střední (komponenta + refactor všech confirmů) | HNED |
| 3 | Approve/Reject preview + bulk undo v importu (#I4) | Vysoký — prevence invalid plateb | Střední (nový modal + endpoint) | BRZY |
| 4 | Audit všech stránek na dark mode (#G4) | Střední — kvalita UI | Nízká (jen dopsat `dark:` třídy) | BRZY |
| 5 | Preview duplicit při generování tuition charges (#T1) | Střední — předcházení confusion | Nízká (jen UI) | BRZY |

---

## Quick wins (nízká složitost, okamžitý efekt)

- [ ] **#L1** Skrýt demo credentials v production (1 if-statement)
- [ ] **#R2** Přidat odkaz „Šablona CSV" + tooltip na Visit Cards upload
- [ ] **#P2** Persist search/filters v URL na stránce Platby (přes `useSearchParams`)
- [ ] **#T2** Rozšířit year dropdown na 5 let zpět + dynamicky jen existující
- [ ] **#G8** Přidat autocomplete="current-password" na login form
- [ ] **#C1** Rozšířit karty tříd o indikátor bez sponzora / dluh
- [ ] **#S6** Filter „Bez sponzora" na Studentech + karta na dashboardu
- [ ] **#A3** Cache MyMemory překladů do DB
- [ ] **#R3** X tlačítko + timeout na CSV match result panelu
- [ ] **#A4** Disabled button místo silent fail u voucher/tuition rate formů
- [ ] **#S7** Zrušit confirm dialog při Save v detailu studenta (toast místo modalu)

---

## Nálezy s nejvyšší pravděpodobností „kritické v praxi"

1. **#G1 (Dirty state)** — každý den několikrát se stane.
2. **#I4 (Approve bez preview)** — rizikové při bulk importu 500+ řádků.
3. **#P4 (Mazání platby bez kontextu)** — nevratné, ovlivní předpisy.
4. **#A2 (Delete codelist item)** — orphaned records v DB.
5. **#S2 (Nová student validace)** — špinavá data postupně.

---

## Důrazně doporučené doplnění mimo scope této analýzy

- **Automated accessibility audit** (axe-core, Lighthouse) — kontrast, aria-labels, keyboard navigation
- **Mobile-first review** — projít všechny stránky v 375px width, ověřit čitelnost
- **E2E testy** pro kritické flow (login → add student → add payment → import CSV → approve)
- **Print stylesheet review** pro visit cards (nejsou testovány zde)
