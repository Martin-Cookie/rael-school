# Rael School – Co aplikace dělá – 2026-04-21

> Srozumitelný popis aplikace pro netechnického čtenáře (management, sponzoři, noví dobrovolníci). Pro technické detaily viz `BUSINESS-LOGIC.md`.

---

## Přehled

**Rael School** je interní systém pro správu sponzorství žáků keňské školy Rael. Slouží managementu školy, dobrovolníkům a sponzorům — **není veřejný**. Aplikace umožňuje evidovat:

- studenty (148 aktivních dětí, 14 tříd),
- sponzory (137 unikátních lidí, kteří školu finančně podporují),
- platby a stravenky,
- předpisy školného a jejich splácení,
- potřeby, přání, vybavení a zdraví studentů,
- importy bankovních výpisů,
- tisk návštěvních karet pro sponzory.

Aplikace je **lokální** (data v souboru na počítači), běží v prohlížeči, data se zálohují do gitu.

---

## Hlavní funkce

### Evidence studentů
Každý student má **unikátní číslo** (např. `RAEL-042`), jméno, třídu, datum narození, informace o rodičích a sourozencích, zdravotní stav, seznam vybavení (matrace, deka, školní boty…), potřeb (co by si přál dostat) a fotografie. Studenti se mohou stát neaktivními (ukončili studium), ale jejich historie se zachovává.

### Sponzorství
Každý sponzor může podporovat **více studentů** a jeden student může mít **více sponzorů**. Sponzor je speciální uživatel, který se může do aplikace přihlásit, ale vidí **pouze své studenty** (read-only). Email sponzora má tvar `jmeno.prijmeni@sponsor.rael.school`, výchozí heslo `sponsor123`.

### Platby a stravenky
V aplikaci jsou **dva typy plateb**:

1. **Sponzorské platby** — peníze pro konkrétního studenta s daným účelem: školné, ordinace (klinika), platba za kávu, taneční klub, semináře. Běžně v KES (keňská měna), ale systém podporuje CZK, EUR, USD i KES.

2. **Stravenky** — nákup poukazů na jídlo. Počet stravenek se automaticky spočítá z částky a aktuální sazby (např. CZK 80 = 1 stravenka, EUR 3, USD 3,5, KES 80).

### Předpisy školného
Pro každé období (např. rok 2026 nebo pololetí 2026-H1) lze vygenerovat **předpisy školného** pro všechny aktivní studenty podle jejich třídy. Sazba je:

- **3 700 CZK / rok** pro PP1 až Grade 6,
- **4 700 CZK / rok** pro Grade 7 až Grade 12.

Stav předpisu (**UNPAID / PARTIAL / PAID**) se automaticky přepočítává podle toho, kolik bylo pro daného studenta v daném roce zaplaceno na školné.

### Import bankovních výpisů
Manager nahraje **CSV z banky**. Systém:
1. načte řádky výpisu,
2. automaticky přiřadí **sponzora** (podle variabilního symbolu, čísla účtu nebo jména),
3. přiřadí **studenta** (pokud sponzor podporuje jen jednoho, nebo podle jména ve zprávě),
4. detekuje **typ platby** (podle klíčových slov ve zprávě — „školné", „stravenky", „ordinace"…),
5. upozorní na pravděpodobné **duplicity**.

Manager může pak:
- **schválit** (vytvoří se platby/stravenky),
- **rozdělit** jeden řádek na 2–5 částí (např. sponzor poslal jednu částku na 3 děti),
- **odmítnout** (nepatří nám).

### Reporty — tisk návštěvních karet
Pro každého studenta lze vytisknout **2stránkový A4 formulář**:
- strana 1: sponzoři, základní údaje, rodina, vybavení;
- strana 2: potřeby, přání, obecné poznámky.

Formulář se vygeneruje v prohlížeči a odešle se na tiskárnu.

### Admin
Správce (ADMIN) spravuje:
- **číselníky** — třídy, typy plateb, potřeby, přání, vybavení, zdravotní prohlídky,
- **sazby školného** (podle třídy) a **sazby stravenek** (podle měny),
- **překlady** — zadá český text, systém automaticky navrhne anglický a svahilský překlad přes externí službu MyMemory,
- **uživatele** a jejich role,
- **zálohy databáze** — export/obnova SQLite souboru.

### Export a zálohy
Všechny hlavní seznamy (Studenti, Sponzoři, Platby, Předpisy) lze exportovat do **CSV** (otvírá se v Excelu). Databáze se dá stáhnout jako `.db` soubor a nahrát zpět — systém ověří, že soubor je platný a v případě chyby vrátí předchozí stav.

---

## Jak spolu věci souvisí

- **Student** je **středobod** systému. Má třídu, rodinu, potřeby, přání, vybavení, zdravotní prohlídky, fotografie.
- **Sponzor** (User s rolí SPONSOR) **podporuje** jednoho nebo více studentů přes entitu **Sponsorship** (vazba s datem startu/konce).
- **Platba** (SponsorPayment nebo VoucherPurchase) jde **od sponzora pro studenta** s určitým **typem**.
- **Předpis školného** říká, kolik student dluží za rok. **Platby typu školné** ho postupně umořují — stav se počítá automaticky.
- **Bank import** vytváří platby a stravenky v dávkách po ověření.

---

## Důležitá pravidla a konvence

### Měna
Aplikace podporuje **4 měny**: CZK, EUR, USD, KES. **Sponzorské platby jsou obvykle v KES** (výchozí), **stravenky obvykle v CZK** (výchozí). Čísla se formátují s mezerou jako oddělovačem tisíců (`1 000 KES`, ne `1,000 KES`).

### Stravenky — jak se počítá počet
Ze zaplacené částky se dělí **sazbou pro danou měnu** a zaokrouhluje dolů:

- zaplaceno 400 CZK při sazbě 80 → **5 stravenek**
- zaplaceno 90 EUR při sazbě 3 → **30 stravenek**

Pokud admin nemá sazbu pro danou měnu, systém použije **bezpečnostní fallback = 80**.

### Školné — kdy se platba započítá
Systém pozná školné podle **názvu typu platby**: pokud obsahuje „školné", „tuition" nebo „karo" (svahilsky). Takže když admin přejmenuje typ platby, logika stále funguje.

### Role uživatelů

| Role | Co může |
|------|---------|
| **ADMIN** | Vše — správa číselníků, uživatelů, zálohy, mazání |
| **MANAGER** | Studenti, platby, předpisy, importy, reporty. Bez administrace. |
| **VOLUNTEER** (dobrovolník) | Edituje jen **přiřazené** studenty (VolunteerAssignment) |
| **SPONSOR** | Vidí jen **své** studenty, pouze čtení |

### Jazyky
Aplikace je **plně třílingvální** — čeština, angličtina, svahilština. Každý nový text se musí přeložit do všech tří. V číselnících (třídy, typy plateb, potřeby) má každá položka tři jazykové mutace. Admin může přidávat s asistencí automatického překladu.

### Dark mode
Každá stránka má světlý a tmavý režim (přepínač v sidebaru).

---

## Bezpečnost

- **Přihlášení** přes email + heslo (bcrypt), 24h session v cookie.
- **Rate limiting** na všechny citlivé operace (max 5 přihlášení / 15 min z jedné IP; max 10 schválení importu / min atd.).
- **CSRF ochrana** — všechny změny v DB vyžadují token v hlavičce.
- **Magic bytes** u fotek — systém kontroluje, že obrázek je skutečně obrázek, ne škodlivý soubor pod maskovaným názvem.
- **Audit log** — všechny důležité akce (CREATE, UPDATE, DELETE, LOGIN, APPROVE, REJECT, SPLIT) se zapisují do historie.
- **Validace restore** — při obnově databáze se ověří, že soubor je validní SQLite s požadovanými tabulkami; pokud obnova poškodí DB, systém vrátí zálohu.

---

## Omezení a specifika

- **Offline-first** — aplikace běží lokálně, data jsou v jednom SQLite souboru (`prisma/dev.db`). Není žádný centrální server.
- **Žádná automatická synchronizace** — pokud běží na dvou počítačích, data se neslučují. Pro více uživatelů je nutné jedno společné nasazení.
- **Zálohování přes git** — klíčové soubory (`dev.db.primary`, `dev.db.backup`) jsou v gitu. Vždy před riskantní akcí je možné obnovit.
- **Výchozí jazyk čeština**, ale všechny texty mají překlady.
- **Žádné SMS, emaily, notifikace** — systém nic neodesílá ven.
- **Externí integrace pouze MyMemory API** pro překlady (volitelné, admin).

---

## Klíčová čísla

- **148 studentů**, z toho 8 bez sponzora
- **137 unikátních sponzorů**
- **160 aktivních sponzorství**
- **224 položek vybavení**
- **31 zdravotních prohlídek**
- **14 tříd** (PP1 → Grade 12)
- **30 sourozeneckých skupin**

---

## Co dělat, když…

### … sponzor pošle peníze za víc dětí najednou
Manager v detailu bank importu klikne na **„Rozdělit"** u daného řádku, zadá 2–5 částí se studenty a typy plateb. Systém zkontroluje, že součet = původní částce, a automaticky vytvoří jednotlivé platby.

### … platba nemá sponzora (anonymní dárce)
V systému lze zadat platbu s `donorName` (text) bez odkazu na uživatele-sponzora. Zobrazí se v seznamech jako anonymní dárce.

### … student přestane navštěvovat školu
Nastaví se mu `isActive = false`. Historie (platby, sponzorství, předpisy) zůstává, ale student nebude viditelný v běžných filtrech.

### … se smaže sponzor
Sponzor nemůže být úplně smazán — platby od něj cascade nemazají (`SetNull` na `sponsorId`), takže platby zůstanou jako „anonymní dárce".

### … se změní sazba školného
Admin v administraci upraví `TuitionRate`. **Existující předpisy se nepřepočítají** — pouze nově generované předpisy použijí novou sazbu. Pokud je potřeba opravit starý předpis, admin ho upraví ručně v sekci Předpisy.

### … se pokazí databáze
Admin nahraje zálohu přes **Administrace → Zálohy → Obnovit**. Systém ověří soubor a v případě problému automaticky vrátí předchozí stav. Alternativně v terminálu: `cp prisma/dev.db.primary prisma/dev.db` a restart serveru.

---

**Konec souhrnu.** Pro technické detaily viz `BUSINESS-LOGIC.md`.
