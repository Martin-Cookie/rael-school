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

> **Detailní UI/frontend konvence** (hooky, komponenty, layout, tabulky, sticky hlavičky, dark mode, formuláře, navigace, záložky, CSV export) jsou v **[docs/UI_GUIDE.md](docs/UI_GUIDE.md)**.
>
> Níže jsou pouze **backend/domain pravidla** související s UI stránkami.

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

### Předpisy školného (Tuition Charges)

Soubory:
- UI: `src/app/tuition/page.tsx`
- API: `src/app/api/tuition-charges/route.ts`
- Prisma model: `TuitionCharge` (studentId, period, amount, currency, status)
- Sazby: `TuitionRate` (annualFee, gradeFrom, gradeTo, currency)

**Generování předpisů:**
- Panel s výběrem studentů (checkboxy, filtr tříd, hledání)
- Sazba se určí automaticky podle třídy studenta a `TuitionRate` číselníku
- Duplikáty se přeskakují (student + období)
- **Roční** = period je jen rok (`"2026"`), **půlroční** = period obsahuje `-H` (`"2026-H1"`)

**Výpočet zaplacené částky:**
- Na serveru se sčítají `SponsorPayment` s typem obsahujícím "školné"/"tuition"/"karo"
- Filtrováno podle studenta, roku z periody a měny předpisu

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
