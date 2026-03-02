# Algoritmus párování plateb — technická dokumentace

> **Soubor:** `src/lib/paymentMatcher.ts`
> **Testy:** `src/__tests__/paymentMatcher.test.ts`
> **Business spec:** [SPEC-payment-import.md](SPEC-payment-import.md) (sekce 4)

---

## Přehled

Algoritmus páruje importované bankovní transakce se sponzory, studenty a typy plateb.
Spouští se funkcí `runMatching(prisma, importId)` ihned po CSV importu.

```
runMatching()
  ├── Načíst referenční data (sponzoři, studenti, typy, existující platby)
  ├── Vytvořit lookup mapy (VS → sponzor, účet → sponzor, typ → ID)
  └── Pro každý řádek:
      ├── matchRow() → MatchResult
      │   ├── Krok 1: Detekce duplikátů
      │   ├── Krok 2: Identifikace sponzora (VS → účet → jméno)
      │   ├── Krok 3: Identifikace studenta
      │   ├── Krok 4: Identifikace typu platby (klíčová slova)
      │   └── Krok 5: Určení statusu
      └── Uložit výsledek do DB
```

---

## Datové struktury

### MatchResult

```typescript
interface MatchResult {
  status: 'NEW' | 'MATCHED' | 'PARTIAL' | 'DUPLICATE'
  sponsorId: string | null
  studentId: string | null
  paymentTypeId: string | null
  matchConfidence: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  matchNotes: string        // semicolon-separated log of match steps
  duplicateOfId: string | null
}
```

### Lookup mapy (pre-built)

| Mapa | Klíč | Hodnota | Účel |
|------|------|---------|------|
| `vsByUser` | `variableSymbol` | `Sponsor` | VS → sponzor (O(1)) |
| `accountByUser` | `bankAccount` | `Sponsor` | Účet → sponzor (O(1)) |
| `paymentTypeByName` | `name` | `paymentTypeId` | Typ → ID (O(1)) |

---

## Krok 1: Detekce duplikátů

**Batch loading:** Všechny existující `SponsorPayment` a `VoucherPurchase` v rozmezí `±1 den` od min/max data importu se načtou jedním dotazem (ne N+1).

**Podmínky shody:**
- `paymentDate` ±1 den od `transactionDate`
- `amount` === `row.amount` (přesná shoda)
- `currency` === `row.currency` (jen pro SponsorPayment)

**Výsledek:** `status: DUPLICATE`, `confidence: HIGH`, `duplicateOfId` = ID nalezené platby.

> **Omezení:** Detekce nezohledňuje sponzora — pokud dva různí sponzoři pošlou stejnou částku ve stejný den, druhá platba bude falešně označena jako duplikát. Admin to vyřeší ručně.

---

## Krok 2: Identifikace sponzora

Priorita (pokud nalezeno, další kroky se přeskočí):

### 2a: Variabilní symbol (VS)
- `row.variableSymbol` → lookup v `vsByUser` mapě
- **Confidence: HIGH**

### 2b: Číslo účtu odesílatele
- `row.senderAccount` → lookup v `accountByUser` mapě
- **Confidence: HIGH**

### 2c: Jméno odesílatele (fuzzy matching)
Dva sub-kroky:

**Full name match (MEDIUM):**
```
normalizeName("Ing. Jan Novák, Ph.D.") → "jan novak"
normalizeName("Jana Nováková") → "jana novakova"

Porovnání: všechny části jména sponzora musí být obsaženy v částech jména odesílatele.
"jan novak" parts = ["jan", "novak"]
"novak jan platba" parts = ["novak", "jan", "platba"]
→ every sponsorPart found in senderParts → MATCH
```

- Vyžaduje ≥2 části u obou jmen
- **Confidence: MEDIUM**

**Last name only match (LOW):**
- Pokud full name nenalezeno, hledá se příjmení sponzora v částech jména odesílatele
- Použije se **pouze pokud** je příjmení unikátní (1 shoda)
- **Confidence: LOW**

### normalizeName()

```typescript
function normalizeName(name: string): string {
  return name
    .normalize('NFD')                    // rozložit znaky s diakritikou
    .replace(/[\u0300-\u036f]/g, '')     // odstranit combining marks
    .toLowerCase()
    .replace(/\b(pan|pani|ing|mgr|...)\b\.?/g, '')  // odstranit tituly
    .replace(/[.,]/g, '')               // odstranit interpunkci
    .replace(/\s+/g, ' ')              // normalizovat whitespace
    .trim()
```

**Odstraňované tituly:** pan, pani, ing, mgr, mudr, mvdr, mddr, phdr, rndr, judr, bc, doc, prof, ph.d, csc

---

## Krok 3: Identifikace studenta

### 3a: Přes sponzora
Pokud byl sponzor nalezen:
- **1 aktivní student** → automaticky přiřazen
- **Více studentů** → `studentId = null`, admin vybere ručně
- **0 studentů** → pokračuje na 3b

### 3b: Hledání jména studenta ve zprávě

Funkce `findStudentInMessage(message, students)`:

```
Pro každého studenta:
  1. Pokud firstName ≥ 3 znaky AND lastName ≥ 3 znaky:
     → hledá oba v normalizované zprávě (nezáleží na pořadí)
  2. Pokud "firstName lastName" jako fráze ≥ 5 znaků:
     → hledá frázi v normalizované zprávě
```

**Ochrana proti false positive:**
- Krátká jména (< 3 znaky per část) se nehledají individuálně
- Fráze musí mít ≥ 5 znaků celkem

---

## Krok 4: Identifikace typu platby

Klíčová slova v `row.message` (case-insensitive):

| Klíčová slova | Typ platby |
|---------------|------------|
| školné, tuition, school fee, skolne, skolné | Školné |
| stravenk, voucher, jídlo, food, meal | Stravenky |
| ordinace, klinik, clinic, lékař, doctor, health | Ordinace - měsíční příspěvek |
| káva, coffee, café, kafe, kávu | Platba za kávu |
| tane, dance, crew | Taneční klub - měsíční příspěvek |
| seminář, seminar, teen, náctilet | Semináře pro náctileté - měsíční příspěvek |

**Mapování:** Klíčové slovo → `typeName` → lookup v `paymentTypeByName` → `paymentTypeId`.

Pokud žádné klíčové slovo → `paymentTypeId = null`.

---

## Krok 5: Výsledný status

| Podmínka | Status | Poznámka |
|----------|--------|----------|
| `sponsorId + studentId + paymentTypeId` | `MATCHED` | Plně spárováno |
| Alespoň jedno z trojice | `PARTIAL` | Částečně, admin doplní |
| Nic | `NEW` | Nepodařilo se spárovat |

---

## Výkon

- **Batch loading:** Všechna referenční data se načítají jedním dotazem per typ (ne N+1)
- **Lookup mapy:** VS a účet jsou O(1) lookup
- **Duplikáty:** Pre-loaded do paměti, in-memory filter
- **Složitost:** O(n * m) kde n = řádky importu, m = max(sponzoři, studenti)

---

## Testy

`src/__tests__/paymentMatcher.test.ts` — 15 testů:

| Skupina | Testy |
|---------|-------|
| `normalizeName` | Diakritika, tituly, interpunkce, whitespace, empty string |
| `findStudentInMessage` | Přesná shoda, obrácené pořadí, case-insensitive, diakritika, krátká jména, žádná shoda |

---

## Exportované funkce

| Funkce | Účel | Volána z |
|--------|------|----------|
| `runMatching(prisma, importId)` | Hlavní orchestrátor | `POST /api/payment-imports` |
| `normalizeName(name)` | Normalizace jména | Testy, interní |
| `findStudentInMessage(msg, students)` | Hledání studenta ve zprávě | Testy, interní |
