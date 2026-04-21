# UX Optimizer Agent – Analýza a návrhy zlepšení UX (Rael School)

> Spouštěj když chceš zlepšit uživatelský zážitek, zjednodušit workflow nebo optimalizovat procesy.
> Agent se dívá na aplikaci šesti různými očima a navrhuje konkrétní zlepšení.

---

## Kontext projektu

- **Stack:** Next.js 14 + TypeScript + Tailwind + Prisma
- **Moduly:** Dashboard, Studenti, Sponzoři, Platby, Stravenky, Předpisy školného, Třídy, Reporty (visit cards), Admin (číselníky, uživatelé)
- **Role:** ADMIN, MANAGER, SPONSOR, VOLUNTEER (různá oprávnění)
- **Jazyky:** cs (výchozí), en, sw
- **Dark mode:** plná podpora
- **UI konvence:** viz `docs/UI_GUIDE.md`

---

## Cíl

Projít zadaný proces (nebo celou aplikaci) a navrhnout zlepšení z pohledu šesti expertních rolí. Výstup: `UX-REPORT.md` s nálezy, návrhy a mockupy.

**NEPRAV ŽÁDNÝ KÓD. POUZE ANALYZUJ A NAVRHUJ.**

---

## Rozsah

### A) Celá aplikace
```
Přečti docs/agents/UX-OPTIMIZER.md a analyzuj celou aplikaci. Výstupem je UX-REPORT.md.
```

### B) Konkrétní proces/modul
```
Přečti docs/agents/UX-OPTIMIZER.md a analyzuj [modul]. Výstupem je UX-REPORT.md.
```

---

## 6 expertních pohledů

### 1. Běžný uživatel
Člověk který aplikaci vidí poprvé nebo ji používá jednou za měsíc (manažer školy, sponzor).

**Otázky:**
- Je jasné co mám dělat? Kde kliknout? Co vyplnit?
- Pochopím terminologii bez školení? (PP1, Grade, voucher, tuition…)
- Vím kde v procesu jsem a kolik kroků zbývá?
- Najdu to co hledám do 3 kliknutí?
- Je jasné co se stalo po mé akci (úspěch / chyba / čekání)?
- Můžu se vrátit zpět bez ztráty dat?

**Hledej:**
- Matoucí názvy, ikony, popisky (včetně lokalizačních klíčů)
- Chybějící nápověda
- Slepé uličky
- Příliš mnoho kroků pro jednoduchý úkol
- Chybějící potvrzení úspěšné akce (useToast?)

### 2. Business proces analytik
Expert na efektivitu workflow a eliminaci plýtvání.

**Otázky:**
- Zbytečné kroky které jdou sloučit nebo odstranit?
- Dá se něco automatizovat co se teď dělá ručně?
- Jsou data zadávána opakovaně na více místech?
- Pořadí kroků je optimální?
- Existují bottlenecky?
- Dají se paralelizovat sekvenční kroky?

**Hledej:**
- Duplicitní zadávání stejných dat
- Kroky které by šly přeskočit s rozumnými defaulty
- Manuální práce kterou by šlo automatizovat
- Chybějící hromadné operace
- Zbytečné přechody mezi stránkami

### 3. UI/UX designer
Expert na vizuální design, layout a interakční vzory.

**Otázky:**
- Vizuální hierarchie je jasná?
- Akční prvky snadno rozpoznatelné?
- Layout konzistentní napříč stránkami?
- Formuláře přehledné a ne příliš dlouhé?
- Funguje stránka na mobilu?
- Prázdný stav řešený smysluplně?

**Hledej:**
- Přehlcené stránky
- Nekonzistentní styly vs UI_GUIDE.md
- Špatná vizuální hierarchie
- Chybějící vizuální zpětná vazba (loading, success, error)
- Formuláře které by šly rozdělit do kroků
- Skryté akce
- Dark mode — každá stránka má dark varianty?

### 4. Performance analytik
Expert na rychlost a efektivitu uživatelské práce.

**Otázky:**
- Kolik kliknutí/kroků trvá nejčastější úkol?
- Dá se snížit?
- Nejčastější akce snadno přístupné?
- Stránka se načítá rychle?
- Dá se použít klávesová zkratka?
- Search je dostatečně chytrý (autocomplete, fuzzy)?

**Hledej:**
- Časté akce schované hluboko v navigaci
- Zbytečná přesměrování
- Chybějící bulk operace
- Pomalé načítání bez loading indikátoru
- Možnosti keyboard shortcuts

### 5. Error recovery expert
Expert na ošetření chyb a obnovu po selhání.

**Otázky:**
- Co se stane když uživatel zadá špatná data?
- Chybová zpráva říká CO opravit?
- Ztratí uživatel data když se něco pokazí?
- Dá se akce vrátit zpět?
- Co se stane při refreshi nebo zavření taby?
- Destruktivní akce chráněné potvrzením?

**Hledej:**
- Generické chybové hlášky
- Ztráta vyplněných dat po chybě
- Nevratné akce bez potvrzení (smazání studenta, platby)
- Chybějící client-side validace
- Chybějící autosave u dlouhých formulářů (detail studenta, import)

### 6. Data quality expert
Expert na kvalitu, konzistenci a integritu dat.

**Otázky:**
- Vstupy validované dostatečně (formát, rozsah, povinnost)?
- Může vzniknout nekonzistence mezi souvisejícími daty?
- Duplicity detekovány a ošetřeny?
- Výchozí hodnoty rozumné?
- Jasné co je povinné a co volitelné?
- Importovaná data validovaná před uložením?

**Hledej:**
- Chybějící validace (email bez @, záporné částky, datum v budoucnosti, unikátní student number)
- Možnost vytvořit duplicity (dva sponzoři se stejným emailem, dva TuitionCharge pro stejné období)
- Nekonzistence (platba na smazaného studenta)
- Importy bez preview / kontroly před uložením
- Chybějící audit trail (kdo co kdy změnil)

---

## Playwright MCP (volitelné — pro vizuální analýzu)

Pokud máš přístup k Playwright MCP, můžeš ověřit UI přímo v prohlížeči:

```
mcp__playwright__browser_navigate      — otevři stránku
mcp__playwright__browser_snapshot      — zkontroluj strukturu a pojmenování
mcp__playwright__browser_take_screenshot — vizuální doklad do reportu
mcp__playwright__browser_console_messages — JS chyby
mcp__playwright__browser_resize        — mobilní breakpointy
```

Užitečné pro:
- Screenshoty současného stavu (před mockup návrhem)
- Ověření prázdného stavu
- Mobile breakpoint kontrola
- Dark mode (přepnutím toggle)

---

## Formát výstupu

Vytvoř `UX-REPORT.md`:

```markdown
# Rael School – UX Report – [modul / celá aplikace] – YYYY-MM-DD

> Analyzováno: YYYY-MM-DD
> Rozsah: [celá aplikace / konkrétní modul]

## Souhrn

| Pohled | Kritické | Důležité | Drobné |
|--------|----------|----------|--------|
| Běžný uživatel | X | X | X |
| Business analytik | X | X | X |
| UI/UX designer | X | X | X |
| Performance analytik | X | X | X |
| Error recovery | X | X | X |
| Data quality | X | X | X |
| **Celkem** | **X** | **X** | **X** |

---

## Nálezy a návrhy

### [Modul/Stránka 1]

#### Nález #1: [stručný název]
- **Severity:** KRITICKÉ / DŮLEŽITÉ / DROBNÉ
- **Pohled:** [role která to našla]
- **Problém:** [co je špatně]
- **Dopad:** [jak ovlivňuje uživatele]
- **Návrh:** [co s tím]
- **Kde v kódu:** `src/.../file.tsx:N`
- **Mockup:**
  ```
  Současný stav:
  ┌──────────────────────────┐
  │ [popis]                  │
  └──────────────────────────┘

  Navrhovaný stav:
  ┌──────────────────────────┐
  │ [popis]                  │
  └──────────────────────────┘
  ```

### [Modul/Stránka 2]
...

---

## Top 5 doporučení (podle dopadu)

| # | Návrh | Dopad | Složitost | Priorita |
|---|-------|-------|-----------|----------|
| 1 | ... | Vysoký | Nízká | HNED |
| 2 | ... | Vysoký | Střední | BRZY |

---

## Quick wins (nízká složitost, okamžitý efekt)
- [ ] ...
- [ ] ...
```

---

## Spuštění

### Celá aplikace
```
Přečti docs/agents/UX-OPTIMIZER.md a analyzuj celou aplikaci (všech 6 pohledů). Výstupem je UX-REPORT.md. Nic neopravuj.
```

### Konkrétní proces
```
Přečti docs/agents/UX-OPTIMIZER.md a analyzuj proces [import bank výpisů / stránka Platby / detail studenta / ...]. Výstupem je UX-REPORT.md.
```
