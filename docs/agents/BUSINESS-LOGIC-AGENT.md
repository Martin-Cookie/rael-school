# Business Logic Agent – Extrakce business logiky (Rael School)

> Spouštěj když potřebuješ zdokumentovat co aplikace dělá — před přepisem do nového stacku,
> pro onboarding nového vývojáře nebo pro předání projektu.

---

## Kontext projektu

- **Stack:** Next.js 14 (App Router), TypeScript, Prisma, SQLite
- **Hlavní moduly:** Studenti, Sponzoři, Platby (sponzorské + stravenky), Předpisy školného, Třídy, Dashboard, Importy bank výpisů, Reporty (visit cards), Admin (číselníky, uživatelé)
- **Klíčové entity (Prisma):** Student, Sponsor, Sponsorship, SponsorPayment, VoucherPurchase, TuitionCharge, PaymentImport, PaymentImportRow, Need, Wish, Equipment, HealthCheck, Photo, User + číselníky (ClassRoom, PaymentType, TuitionRate, VoucherRate, NeedType, WishType, EquipmentType)

---

## Cíl

Projdi projekt a extrahuj business logiku do dvou dokumentů:

1. **`BUSINESS-LOGIC.md`** — technický dokument (pro vývojáře / Clauda)
2. **`BUSINESS-SUMMARY.md`** — srozumitelný souhrn (pro netechnické — management, sponzoři)

**NEPRAV ŽÁDNÝ KÓD. POUZE ANALYZUJ A DOKUMENTUJ.**

---

## Postup

Projdi VŠECHNY relevantní soubory:
- `prisma/schema.prisma` — modely, relace, indexy
- `src/app/api/**/route.ts` — API logika, validace, autorizace
- `src/lib/**` — helpery, utility (`format.ts`, `auth.ts`, `csrf.ts`, `imageUtils.ts`, business helpery jako `recalcTuitionStatus`)
- `src/app/**/page.tsx` — UI flow, uživatelské interakce
- `src/hooks/**` — sdílené chování
- `prisma/seed.ts` — výchozí data, sazby, číselníky

Čti řádek po řádku a hledej business logiku, pravidla a skryté know-how.

---

## 1. BUSINESS PROCESY (workflow)

### Co hledat
- Vícekrokové procesy (vytvoření → editace → schválení → dokončení)
- Stavové automaty (např. TuitionCharge: UNPAID → PARTIAL → PAID; PaymentImportRow: NEW → APPROVED / REJECTED / SPLIT / PARTIAL)
- Uživatelské flow (co uživatel klikne, co se stane)
- Podmíněné větvení (pokud X, tak Y, jinak Z)
- Automatické akce na pozadí (auto-přepočet počtu stravenek, auto-approve v importu)

### Ukázkové procesy v Rael
- **Přidání studenta** — formulář, validace, vytvoření, přiřazení do třídy, první sponzorství
- **Sponzorská platba** — vytvoření platby, napojení na studenta, přepočet tuition status
- **Nákup stravenek** — výpočet počtu z částky a sazby (VoucherRate)
- **Import bank výpisu** — upload → parsing → přiřazení → split → approve → generování plateb
- **Generování předpisů školného** — výběr studentů → výpočet podle TuitionRate → kontrola duplikátů → zápis TuitionCharge
- **Visit card** — načtení dat studenta → formátování do A4 → tisk přes iframe

### Jak dokumentovat
```markdown
### [Název procesu]

**Účel:** Co proces řeší
**Vstupní podmínky:** Co musí platit před spuštěním
**Kroky:**
1. Uživatel udělá X
2. Systém zkontroluje Y
3. Pokud podmínka → 4a, jinak → 4b
4a. Systém vytvoří Z
4b. Systém zobrazí chybu

**Kde v kódu:** `src/app/.../route.ts:funcName()` ř. XX–YY
**Stavový diagram (pokud relevantní):**
[stav1] → akce → [stav2] → akce → [stav3]
**Role a autorizace:** ADMIN/MANAGER/…
```

---

## 2. BUSINESS PRAVIDLA

### Co hledat
- **Validační pravidla** — formát, rozsah, povinnost, unikátnost
- **Výpočetní pravidla** — vzorce, konverze, zaokrouhlování
- **Prahy a limity** — magická čísla (proč 80 pro VoucherRate? proč 3700/4700 tuition?)
- **Pořadí operací** — FK závislosti, cascade delete
- **Defaultní hodnoty** — co se nastaví když uživatel nevyplní
- **Formátovací pravidla** — datum, měna za číslem s mezerou, student number formát
- **Řazení a filtrování** — přirozené řazení tříd (PP1 → Grade 12)
- **Deduplikace** — student + období nesmí mít dva TuitionCharge
- **Párování/matching** — bank import: jméno → student/sponzor, typ → paymentType

### Ukázky Rael pravidel
- **Voucher count** = `Math.floor(amount / VoucherRate.rate)` s fallback 80 pokud rate neexistuje
- **Tuition status** — UNPAID (0 zaplaceno), PARTIAL (0 < zaplaceno < předepsáno), PAID (≥ předepsáno)
- **Auto-přepočet stravenek** — při změně částky nebo měny
- **Detekce stravenky v importu** — `paymentType.name` obsahuje "stravenk" nebo "voucher" (case-insensitive)
- **Tuition matching** — SponsorPayment se počítá do zaplaceno pokud typ obsahuje "školné"/"tuition"/"karo"
- **CURRENCIES** — předdefinovaný seznam `['CZK', 'EUR', 'USD', 'KES']`
- **Stravenky vždy v KES**

### Jak dokumentovat
```markdown
### [Název pravidla]

**Pravidlo:** [stručný popis]
**Důvod:** [proč existuje]
**Implementace:** [jak je v kódu]
**Kde v kódu:** `src/lib/xxx.ts:funcName` ř. X
**Hodnoty:** [konkrétní konstanty]
```

---

## 3. DATOVÝ MODEL

### Co hledat
- **Entity a jejich účel** — co reprezentuje v doméně (ne jen název tabulky)
- **Relace a jejich sémantika** — `Sponsorship` = sponzor PODPORUJE studenta, ne jen FK
- **Constraints** — unique, not null, cascade — a PROČ existují
- **Enum hodnoty** — co znamená UNPAID/PARTIAL/PAID, NEW/APPROVED/REJECTED/SPLIT/PARTIAL
- **Computed atributy** — tuition status (runtime), věk studenta
- **Temporální aspekty** — období tuition (`"2026"` / `"2026-H1"`), datum plateb
- **Soft delete vs hard delete** — co se archivuje, co se maže

### Klíčové entity Rael
- **Student** — podporovaný žák (účel, identifikace, třída, rodina, zdraví, vybavení)
- **Sponsor** — podporovatel, může mít více studentů
- **Sponsorship** — vazba sponzor–student (M:N), poznámka o době podpory
- **SponsorPayment** — platba od sponzora (nebo anonymní přes `donorName`)
- **VoucherPurchase** — nákup stravenek (specifická logika pro voucher typ)
- **TuitionCharge** — předpis školného pro studenta na období
- **PaymentImport** + **PaymentImportRow** — bank import s parent/child řádky (pro splits)
- **Need / Wish / Equipment** — potřeby / přání / vybavení studenta
- **HealthCheck / Photo** — doplňková data

### Jak dokumentovat
```markdown
### [Entita]

**Business účel:** [co reprezentuje]
**Klíčové atributy:**
- `atribut` — [business význam]
- `status` — [výčet + význam]

**Relace:**
- → Entita2: [význam] (1:N / M:N)

**Životní cyklus:** [vytvoření] → [stavy] → [ukončení]
**Pravidla:** [co musí platit]
```

---

## 4. EDGE CASES A WORKAROUNDY

### Co hledat
- Komentáře `// POZOR`, `// HACK`, `// WORKAROUND`, `// FIXME`, `// XXX`
- `try/catch` s nestandardním chováním
- Podmínky pro speciální případy (`if (currency !== 'KES')`, `if (!rate) rate = 80`)
- Fallback hodnoty (`?? 0`, `|| ''`)
- Konverze typů (často maskují nekonzistence v datech)
- Platform specifika
- Encoding workaroundy (BOM v CSV, UTF-8, diakritika)
- Hardcoded hodnoty které by měly být konfigurovatelné

### Jak dokumentovat
```markdown
### [Edge case]

**Problém:** [co se stane bez workaroundu]
**Příčina:** [proč problém vzniká]
**Řešení:** [jak je ošetřeno]
**Kde v kódu:** `src/.../file.ts:N`
**Riziko:** [co se stane když se odstraní]
```

---

## 5. INTEGRACE

### Co hledat
- **Import dat** — bank výpisy (CSV/XLSX parsing, mapování, detekce konfliktů)
- **Export dat** — CSV export (Studenti, Sponzoři, Platby, Předpisy)
- **Externí API** — MyMemory API pro překlady v admin sekci (cs→en, cs→sw)
- **Souborový systém** — fotografie (upload, magic bytes validace, storage)
- **Tisk/PDF** — visit cards (print iframe, A4 layout)
- **Autentizace** — JWT cookies, bcrypt hesla

### Jak dokumentovat
```markdown
### [Integrace]

**Směr:** Import / Export / Obousměrná
**Zdroj/Cíl:** [odkud/kam]
**Formát:** [CSV, XLSX, PDF, API]
**Mapování:** [jak se převádějí pole]
**Validace:** [co se kontroluje]
**Chybové stavy:** [co se stane při selhání]
**Kde v kódu:** `src/.../xxx.ts`
```

---

## Formát výstupu

### BUSINESS-LOGIC.md (technický)

```markdown
# Rael School – Business Logic – YYYY-MM-DD

> Automaticky extrahováno z kódu. Dokumentuje veškerou business logiku aplikace.

## Obsah
1. Business procesy
2. Business pravidla
3. Datový model
4. Edge cases a workaroundy
5. Integrace
6. Appendix: Konstanty a konfigurace

---

## 1. Business procesy
### 1.1 Přidání studenta
### 1.2 Sponzorská platba
### 1.3 Nákup stravenek
### 1.4 Import bank výpisu (přiřazení, split, approve)
### 1.5 Generování předpisů školného
### 1.6 Visit card (tisk)

## 2. Business pravidla
### 2.1 Voucher count výpočet
### 2.2 Tuition status
### 2.3 Auto-přepočet stravenek
### 2.4 Detekce typu platby z importu
### 2.5 Měna a formátování
### 2.6 Řazení tříd

## 3. Datový model
### 3.1 Student
### 3.2 Sponsor
### 3.3 Sponsorship
### 3.4 SponsorPayment
### 3.5 VoucherPurchase
### 3.6 TuitionCharge
### 3.7 PaymentImport + PaymentImportRow
### 3.8 Need / Wish / Equipment
### 3.9 User + role

## 4. Edge cases a workaroundy
### 4.1 Chybějící VoucherRate → fallback 80
### 4.2 Přirozené řazení tříd
### 4.3 CSV BOM prefix

## 5. Integrace
### 5.1 Bank výpis parsing
### 5.2 CSV export
### 5.3 MyMemory překlad API
### 5.4 Visit card print
### 5.5 Fotografie upload

## 6. Appendix: Konstanty a konfigurace

| Konstanta | Hodnota | Kde | Účel |
|-----------|---------|-----|------|
| `CURRENCIES` | `['CZK', 'EUR', 'USD', 'KES']` | `src/lib/...` | Dropdowny |
| Výchozí VoucherRate | 80 | `prisma/seed.ts` | Fallback pro nákup stravenek |
| Tuition PP1–G6 | 3700 CZK | `prisma/seed.ts` TuitionRate | Roční školné |
| Tuition G7–G12 | 4700 CZK | `prisma/seed.ts` TuitionRate | Roční školné |
```

### BUSINESS-SUMMARY.md (netechnický)

```markdown
# Rael School – Co aplikace dělá – YYYY-MM-DD

> Srozumitelný popis pro netechnického člověka.

## Přehled
Rael School je interní systém pro správu sponzorství žáků keňské školy. Eviduje studenty, jejich sponzory, platby, stravenky, potřeby a předpisy školného. Je pro management školy, dobrovolníky a sponzory — ne veřejnost.

## Hlavní funkce

### Evidence studentů
Jména, třídy, rodiny, zdravotní stav, vybavení, potřeby, přání. Aktuálně 148 studentů.

### Sponzorství
Propojení sponzorů se studenty (jeden sponzor může podporovat víc dětí, jedno dítě může mít víc sponzorů).

### Platby
Dva typy — sponzorské platby (školné, osobní potřeby, …) a stravenky (speciální měna v KES).

### Předpisy školného
Roční/půlroční předpisy podle třídy a sazby. Sledování zaplaceno / zbývá / stav.

### Import bank výpisů
Nahrání CSV z banky, automatické přiřazení ke studentovi a typu platby, možnost split, schválení.

### Reporty a tisk
Návštěvní karty (A4, 2 strany) pro sponzory. CSV exporty.

### Admin
Správa číselníků (třídy, typy plateb, sazby), překlady (cs/en/sw) přes automatický překladač.

## Jak spolu věci souvisí
- **Student** je středobod — má **třídu**, **rodinu**, **potřeby**, **přání**, **vybavení**, **zdravotní prohlídky**, **fotografie**.
- **Sponzor** **podporuje** jednoho nebo více studentů přes **sponzorství**.
- **Platba** jde od sponzora (nebo anonymního dárce) pro konkrétního studenta s určitým **typem**.
- **Předpis školného** říká, kolik student dluží. **Platby typu školné** ho postupně umořují.

## Důležitá pravidla
- **Stravenky** jsou vždy v KES. Přepočet přes **sazbu stravenky** (cena 1 stravenky v dané měně).
- **Školné** se liší podle třídy: mladší děti 3700 CZK/rok, starší 4700 CZK/rok.
- **Role:** Admin vidí vše. Manager spravuje studenty a platby. Sponzor vidí jen své podporované studenty. Dobrovolník edituje data.
- **Každý text v UI** je přeložen do češtiny, angličtiny a svahilštiny.

## Omezení a specifika
- Offline-first: aplikace běží lokálně, data jsou v SQLite souboru.
- Žádná automatická synchronizace mezi instancemi (pro víc uživatelů nutné jedno společné nasazení).
- Zálohování přes git (committované DB soubory).
- Výchozí jazyk čeština, ale všechny texty mají překlady.
```

---

## Spuštění

```
Přečti docs/agents/BUSINESS-LOGIC-AGENT.md a extrahuj business logiku projektu. Výstupem jsou BUSINESS-LOGIC.md a BUSINESS-SUMMARY.md. Nic neměň v kódu.
```
