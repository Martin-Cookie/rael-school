# Rael School – Kompletní zadání informačního systému

> **Tento dokument je zdroj pravdy pro celý projekt.** Obsahuje vše potřebné k reprodukci aplikace od nuly.
> Pravidla pro práci s AI asistentem jsou v souboru `CLAUDE.md`.

**Repozitář:** https://github.com/Martin-Cookie/rael-school
**Poslední aktualizace:** 11. únor 2026

## 1. Přehled projektu

Informační systém pro keňskou školu **Rael School**, která je podporována českými sponzory. Systém slouží ke sledování studentů, sponzorů, plateb, stravenek, zdravotních prohlídek a fotografií. Systém používají čeští dobrovolníci a sponzoři, keňský personál školy i manažeři projektu.

## 2. Technický stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Databáze:** SQLite (jednoduchý, jeden soubor, žádná konfigurace serveru)
- **ORM:** Prisma
- **CSS:** Tailwind CSS
- **Autentizace:** JWT tokeny s httpOnly cookies, bcrypt pro hesla
- **Ikony:** lucide-react
- **Datum:** date-fns
- **Lokalizace:** Vlastní i18n systém s JSON soubory (cs/en/sw)

### Důležité technické poznámky

- Next.js 14 **nepoužívá** `use(params)` hook — params v komponentách jsou synchronní objekt `{ params: { id: string } }`, ne `Promise`.
- Všechny API routes se stejnými params: `{ params }: { params: { id: string } }` (bez `Promise`, bez `await`).
- Text v celé aplikaci musí být **černý (#1a1a1a)** pro maximální čitelnost.
- Čísla se formátují s **oddělovačem tisíců** (1 000 místo 1000).
- Aplikace musí být optimalizovaná pro **pomalý internet** (Keňa).
- Auth funkce se jmenuje `getCurrentUser()` (ne `verifyAuth`), importuje se z `@/lib/auth`.
- Toast notifikace používají `showMsg()` funkci (ne `showToast`).

## 3. Uživatelské role a oprávnění

| Role | Práva |
|------|-------|
| **ADMIN** | Plný přístup, správa uživatelů, mazání, administrace |
| **MANAGER** | Editace studentů, přidávání dat, přehledy |
| **SPONSOR** | Vidí pouze své přiřazené studenty (read-only) |
| **VOLUNTEER** | Editace studentů, přidávání dat |

- Editovat mohou: ADMIN, MANAGER, VOLUNTEER
- Sponzor vidí jen studenty přiřazené přes tabulku Sponsorship

## 4. Trojjazyčné rozhraní (i18n)

Tři jazyky: **čeština (cs)**, **angličtina (en)**, **svahilština (sw)**. Výchozí jazyk: čeština.

Přepínač jazyků v:
- Přihlašovací stránce (vlajky/zkratky CS/EN/SW)
- Postranním menu (dolní část)

Jazyk se ukládá do `localStorage` a propaguje přes `CustomEvent('locale-change')`.

### Kompletní překladové klíče (česká verze jako reference)

```
app.title = Škola Rael
app.subtitle = Informační systém
app.loading = Načítání...
app.save = Uložit
app.cancel = Zrušit
app.edit = Upravit
app.delete = Smazat
app.add = Přidat
app.close = Zavřít
app.confirm = Potvrdit
app.yes = Ano
app.no = Ne
app.back = Zpět
app.search = Hledat...
app.noData = Žádná data
app.actions = Akce
app.confirmSave = Opravdu chcete uložit změny?
app.confirmDelete = Opravdu chcete smazat tento záznam?
app.savedSuccess = Úspěšně uloženo
app.deleteSuccess = Úspěšně smazáno
app.error = Došlo k chybě
app.editMode = Režim úprav
app.viewMode = Režim zobrazení

nav.dashboard = Přehled
nav.students = Studenti
nav.sponsors = Sponzoři
nav.payments = Platby
nav.reports = Statistiky
nav.settings = Nastavení
nav.logout = Odhlásit se
nav.admin = Administrace

auth.login = Přihlášení
auth.email = E-mail
auth.password = Heslo
auth.loginButton = Přihlásit se
auth.loginError = Neplatný e-mail nebo heslo
auth.logoutSuccess = Úspěšně odhlášeno

dashboard.title = Přehled
dashboard.totalStudents = Celkem studentů
dashboard.totalSponsors = Celkem sponzorů
dashboard.totalPayments = Celkem plateb
dashboard.activeSponsors = Aktivní sponzoři
dashboard.recentPayments = Poslední platby
dashboard.studentsNeedingAttention = Studenti vyžadující pozornost
dashboard.classOverview = Přehled tříd

student.list = Seznam studentů
student.detail = Detail studenta
student.new = Nový student
student.studentNo = Číslo studenta
student.firstName = Jméno
student.lastName = Příjmení
student.dateOfBirth = Datum narození
student.age = Věk
student.gender = Pohlaví
student.male = Muž
student.female = Žena
student.className = Třída
student.healthStatus = Zdravotní stav
student.notes = Poznámky
student.tabs.personal = Osobní údaje
student.tabs.photos = Fotografie
student.tabs.vouchers = Stravenky
student.tabs.sponsors = Sponzoři
student.tabs.health = Zdravotní prohlídky
student.family.title = Rodina
student.family.motherName = Jméno matky
student.family.motherAlive = Matka žije
student.family.fatherName = Jméno otce
student.family.fatherAlive = Otec žije
student.family.siblings = Sourozenci
student.profilePhoto = Profilová fotka

equipment.title = Vybavení
equipment.bed = Postel
equipment.mattress = Matrace
equipment.blanket = Deka
equipment.mosquito_net = Moskytiéra
equipment.condition = Stav
equipment.new = Nové
equipment.satisfactory = Uspokojivé
equipment.poor = Špatné
equipment.acquiredAt = Datum pořízení
equipment.type = Typ

needs.title = Potřeby a přání
needs.description = Popis
needs.fulfilled = Splněno
needs.unfulfilled = Nesplněno
needs.fulfilledAt = Datum splnění
needs.addNeed = Přidat potřebu

photos.title = Fotografie
photos.upload = Nahrát fotografii
photos.category = Kategorie
photos.visit = Z návštěvy
photos.handover = Z předání
photos.voucher = Ze stravenky
photos.description = Popis
photos.takenAt = Datum pořízení
photos.filterAll = Všechny
photos.noPhotos = Žádné fotografie

vouchers.title = Stravenky
vouchers.purchases = Zakoupené stravenky
vouchers.usages = Čerpané stravenky
vouchers.purchaseDate = Datum nákupu
vouchers.amount = Částka
vouchers.count = Počet stravenek
vouchers.usageDate = Datum čerpání
vouchers.usedCount = Čerpáno
vouchers.totalAmount = Celková částka
vouchers.totalPurchased = Celkem nakoupeno
vouchers.totalUsed = Celkem čerpáno
vouchers.available = Dostupné stravenky
vouchers.addPurchase = Přidat nákup
vouchers.addUsage = Přidat čerpání
vouchers.donorName = Jméno dárce
vouchers.selectSponsor = Vybrat sponzora

sponsors.title = Sponzoři
sponsors.name = Jméno
sponsors.email = E-mail
sponsors.phone = Telefon
sponsors.startDate = Začátek sponzorství
sponsors.notes = Poznámky
sponsors.addSponsor = Přidat sponzora
sponsors.noSponsors = Žádní sponzoři
sponsors.removeSponsor = Odebrat sponzora

health.title = Zdravotní prohlídky
health.checkDate = Datum prohlídky
health.checkType = Typ prohlídky
health.dentist = Zubař
health.general = Praktik
health.urgent = Urgentní
health.notes = Poznámka
health.addCheck = Přidat prohlídku
health.selectType = -- Vyberte typ prohlídky --
health.noChecks = Žádné prohlídky

payments.title = Platby
payments.paymentDate = Datum platby
payments.amount = Částka
payments.notes = Poznámka
payments.source = Zdroj
payments.manual = Ruční
payments.bankImport = Import z banky
payments.addPayment = Přidat platbu
payments.importPayments = Importovat platby
payments.totalPayments = Celkem plateb
payments.noPayments = Žádné platby
payments.fillRequired = Vyplňte všechna povinná pole

sponsorPayments.title = Platby od sponzorů
sponsorPayments.paymentType = Typ platby
sponsorPayments.tuition = Školné
sponsorPayments.medical = Lékař
sponsorPayments.other = Jiné
sponsorPayments.selectSponsor = Vybrat sponzora
sponsorPayments.selectType = -- Vyberte typ platby --

admin.classrooms = Číselník tříd
admin.newClassName = Název nové třídy
admin.healthTypes = Druhy zdravotních prohlídek
admin.newHealthTypeName = Název nového druhu
admin.paymentTypes = Typy plateb od sponzorů
admin.newPaymentTypeName = Název nového typu

roles.ADMIN = Administrátor
roles.MANAGER = Manažer
roles.SPONSOR = Sponzor
roles.VOLUNTEER = Dobrovolník

sponsorPage.addSponsor = Přidat sponzora
sponsorPage.requiredFields = Vyplňte jméno, příjmení a email
sponsorPage.emailExists = Email je již použitý
sponsorPage.inactive = Neaktivní
sponsorPage.deactivate = Deaktivovat
sponsorPage.reactivate = Reaktivovat
sponsorPage.confirmDeactivate = Opravdu chcete deaktivovat tohoto sponzora?
sponsorPage.confirmReactivate = Opravdu chcete reaktivovat tohoto sponzora?
sponsorPage.students = Studenti
sponsorPage.noResults = Žádní sponzoři nenalezeni
sponsorPage.searchExisting = Vyhledat existujícího sponzora
sponsorPage.searchByName = Hledat podle příjmení...
sponsorPage.orAddNew = nebo přidat nového
```

Všechny klíče musí existovat ve všech třech jazycích (cs, en, sw).

## 5. Databázové schéma

### User
- id (cuid), email (unique), password (bcrypt hash), firstName, lastName, phone?, role (ADMIN/MANAGER/SPONSOR/VOLUNTEER), isActive, createdAt, updatedAt
- Relace: sponsorships[], assignedStudents[], sponsorPayments[], voucherPurchases[] (via "VoucherSponsor")

### Student
- id (cuid), studentNo (unique, formát RAEL-XXX s auto-inkrementací), firstName, lastName, dateOfBirth?, gender? (M/F), className?, healthStatus?, profilePhoto? (cesta k souboru), motherName?, motherAlive? (boolean), fatherName?, fatherAlive? (boolean), siblings?, isActive, notes?, createdAt, updatedAt

### Equipment
- id, studentId (FK→Student, CASCADE), type (bed/mattress/blanket/mosquito_net), condition (new/satisfactory/poor), acquiredAt?, notes?, createdAt, updatedAt

### Need
- id, studentId (FK→Student, CASCADE), description, isFulfilled (default false), fulfilledAt?, notes?, createdAt, updatedAt

### Photo
- id, studentId (FK→Student, CASCADE), category (visit/handover/voucher), fileName, filePath, description?, takenAt (default now), createdAt

### VoucherPurchase
- id, studentId (FK→Student, CASCADE), purchaseDate, amount (Float), count (Int), donorName? (legacy), **sponsorId? (FK→User, SET NULL, relation "VoucherSponsor")**, notes?, createdAt
- Nové záznamy používají sponsorId (dropdown ze sponzorů), staré záznamy mohou mít donorName jako fallback

### VoucherUsage
- id, studentId (FK→Student, CASCADE), usageDate, count (Int), notes?, createdAt

### Sponsorship
- id, studentId (FK→Student, CASCADE), userId (FK→User, CASCADE), startDate, endDate?, notes?, isActive, createdAt, updatedAt

### HealthCheck
- id, studentId (FK→Student, CASCADE), checkDate, checkType (dentist/general/urgent), notes?, createdAt, updatedAt

### Payment
- id, studentId? (FK→Student, SET NULL), paymentDate, amount (Float), notes?, source? (manual/bank_import), createdAt

### SponsorPayment
- id, studentId (FK→Student, CASCADE), sponsorId? (FK→User, SET NULL), paymentDate, amount (Float), currency (default "KES"), paymentType (tuition/medical/other), notes?, createdAt

### VolunteerAssignment
- id, userId (FK→User, CASCADE), studentId (FK→Student, CASCADE), createdAt, unique(userId+studentId)

### ClassRoom
- id (cuid), name (unique), sortOrder (Int, default 0), isActive (default true), createdAt

### HealthCheckType
- id (cuid), name (unique), sortOrder (Int, default 0), isActive (default true), createdAt

### PaymentType
- id (cuid), name (unique), sortOrder (Int, default 0), isActive (default true), createdAt

## 6. Autentizace

### Přihlašovací stránka (/login)
- Gradient pozadí, centrovaný formulář
- Email + heslo s tlačítkem zobrazit/skrýt heslo
- Přepínač jazyků (CS/EN/SW)
- Zobrazení demo přihlašovacích údajů
- Po úspěšném přihlášení redirect na /dashboard

### API
- POST /api/auth/login — validace, vytvoření JWT, nastavení httpOnly cookie
- POST /api/auth/logout — smazání cookie
- GET /api/auth/me — vrací aktuálního uživatele

### Demo účty (seed data)
- admin@rael.school / admin123 (ADMIN)
- manager@rael.school / manager123 (MANAGER)
- sponsor@example.com / sponsor123 (SPONSOR)
- volunteer@example.com / volunteer123 (VOLUNTEER)

## 7. Layout a navigace

### Postranní menu (Sidebar)
- Logo "Škola Rael - Informační systém"
- Položky (v tomto pořadí):
  1. Přehled (LayoutDashboard) — všechny role
  2. Studenti (Users) — všechny role
  3. **Sponzoři (Heart)** — ADMIN, MANAGER, VOLUNTEER (ne SPONSOR)
  4. Platby (CreditCard) — ADMIN, MANAGER, VOLUNTEER
  5. Statistiky (BarChart3) — ADMIN, MANAGER
  6. Administrace (Settings) — jen ADMIN
- Responsivní (hamburger menu na mobilu)
- Přepínač jazyků dole
- Profil přihlášeného uživatele (jméno, role s barevným badge)
- Tlačítko odhlášení

### Barevné schéma (keňský motiv)
- Primary: zelená (#16a34a a odstíny)
- Accent: žlutá/oranžová (#eab308 a odstíny)
- Earth: hnědá (#92400e a odstíny)
- Text: vždy #1a1a1a (černý)

## 8. Dashboard (/dashboard)

### Klikací statistické karty (5 karet v řadě)
1. **Celkem studentů** → zobrazí tabulku studentů
2. **Aktivní sponzoři** → zobrazí tabulku sponzorů
3. **Platby od sponzorů** → zobrazí záložku plateb s podzáložkami (platby od sponzorů / zakoupené stravenky)
4. **Studenti vyžadující pozornost** → zobrazí studenty s nesplněnými potřebami
5. **Přehled tříd** → zobrazí karty tříd, kliknutím na třídu se zobrazí seznam žáků

### Karta plateb zobrazuje součty po měnách
- Systém pracuje se 3 měnami: KES, CZK, EUR (případně USD)
- Na kartě plateb se zobrazí součet pro každou měnu zvlášť: "5 000 KES | 2 000 CZK"
- Stravenky jsou vždy v KES

### Záložka plateb má dvě podzáložky (tab switcher)
1. **Platby od sponzorů** — tabulka: datum, typ (badge), částka s měnou, student (odkaz), sponzor, poznámka. Nad tabulkou: barevné karty se součty po měnách.
2. **Zakoupené stravenky** — tabulka: datum, částka, počet, student (odkaz), sponzor, poznámka. Nad tabulkou: celková částka a celkem nakoupeno.

### Výchozí aktivní karta: Studenti
### Aktivní karta má barevný rámeček odpovídající barvě ikony.

### Všechny tabulky mají třídění
- Kliknutí na záhlaví sloupce → vzestupné/sestupné řazení
- Ikona šipky (ChevronUp/ChevronDown pro aktivní, ArrowUpDown pro neaktivní)

### Tabulka studentů zobrazuje
- Číslo studenta, příjmení (klikací odkaz na detail), jméno, třída, pohlaví, počet nesplněných potřeb (červený badge), počet sponzorů (zelený badge)

### Tabulka sponzorů zobrazuje
- Příjmení, jméno, email, telefon, podporovaní studenti (klikací badge odkazy na konkrétního studenta)

### Přehled tříd
- Klikací karty s názvem třídy a počtem studentů
- Po kliknutí na třídu: tabulka žáků dané třídy s odkazem zpět na přehled tříd

## 9. Seznam studentů (/students)

- Vyhledávání (realtime, 300ms debounce)
- Karta "Přidat nového studenta" → /students/new
- Grid layout (1/2/3 sloupce dle šířky)
- Kartička studenta obsahuje:
  - **Profilovou fotku** (kulatý avatar vlevo) — pokud nemá, zobrazí zelený kroužek s ikonou User
  - Jméno, příjmení
  - Číslo studenta
  - Badge: třída, věk, počet potřeb (červený), jméno sponzora (žlutý)
- Kliknutí na kartičku → detail studenta

## 10. Nový student (/students/new)

- Formulář: jméno, příjmení, datum narození, pohlaví, třída, zdravotní stav
- Auto-generování studentNo (RAEL-XXX, kde XXX je další číslo v pořadí)
- Po uložení redirect na detail

## 11. Detail studenta (/students/[id])

### Hlavička
- Tlačítko zpět (→ /students)
- **Profilová fotka** (kulatý avatar 56px) — při hoveru myší se zobrazí ikona fotoaparátu, kliknutím se nahraje nová fotka
- Jméno, příjmení
- Podtitulek: číslo studenta, třída, věk
- Tlačítko "Upravit" (jen pro ADMIN/MANAGER/VOLUNTEER)

### Režim úprav
- Žlutý banner "Režim úprav"
- Tlačítka Zrušit / Uložit
- Před uložením potvrzovací dialog

### Záložky (v tomto pořadí!)
1. **Osobní údaje**
2. **Vybavení**
3. **Potřeby a přání**
4. **Stravenky**
5. **Fotografie**
6. **Sponzoři**
7. **Platby od sponzorů**
8. **Zdravotní prohlídky**

### 11.1 Osobní údaje
- Grid 2 sloupce: jméno, příjmení, datum narození, pohlaví (dropdown M/F), třída (dropdown z číselníku ClassRoom), zdravotní stav
- Sekce Rodina: jméno matky, matka žije (Ano/Ne dropdown), jméno otce, otec žije, sourozenci
- Poznámky (textarea)
- V režimu úprav: inputy; jinak: text
- **Třída je SelectField** — dropdown načítá hodnoty z API `/api/admin/classrooms` (aktivní třídy seřazené dle sortOrder)

### 11.2 Vybavení (samostatná záložka)
- Tabulka: typ (postel/matrace/deka/moskytiéra), stav (badge: zelený=nové, žlutý=uspokojivé, červený=špatné), datum pořízení
- V režimu úprav: dropdown pro stav, date picker pro datum
- Pokud chybí některý typ vybavení, automaticky se přidá při přepnutí do edit mode

### 11.3 Potřeby a přání (samostatná záložka)
- Tlačítko "Přidat potřebu" (+)
- Inline přidání: textový input + tlačítko Přidat (Enter = submit)
- Každá potřeba: checkbox (kliknutím toggle fulfilled), popis, datum splnění, ikona koše pro smazání
- Zelené pozadí = splněno (s přeškrtnutím), červené pozadí = nesplněno
- Potvrzení před smazáním

### 11.4 Stravenky
- **Výběr měny** vedle nadpisu (dropdown: KES, CZK, USD, EUR) — ukládá se do localStorage
- Přehledové karty: celková částka, celkem nakoupeno, celkem čerpáno, dostupné (zelená pokud >0, červená pokud ≤0)
- Formulář přidání: typ (nákup/čerpání), datum, částka (jen u nákupu), počet, **jméno dárce** (textové pole + dropdown s existujícími sponzory dítěte, default = první sponzor), poznámka
- **Tabulka zakoupených:** datum | částka | počet | jméno dárce | poznámka | **ikona koše pro smazání**
- **Tabulka čerpaných:** datum | (prázdný spacer) | počet | (prázdný spacer) | poznámka | **ikona koše pro smazání**
- Sloupce "počet" v obou tabulkách musí být **přesně pod sebou** (proto spacery)
- Potvrzení před smazáním

### 11.5 Fotografie
- Filtr: Všechny / Z návštěvy / Z předání / Ze stravenky
- Tlačítko "Nahrát fotografii"
- Formulář: kategorie, **datum pořízení** (date picker), popis, výběr souboru
- Grid 3 sloupce: náhled fotky (h-48, object-cover), popis, datum, badge kategorie
- **Tlačítko smazání** (ikona koše) na každé fotce
- Soubory se ukládají do public/uploads/{studentId}/

### 11.6 Sponzoři
- **Vyhledat existujícího sponzora** — toggle tlačítko s lupou, otevře search input s autocomplete dropdown (hledá podle příjmení přes `/api/sponsors/search`)
- Tlačítko "Přidat sponzora" — formulář: jméno*, příjmení*, email*, telefon, datum začátku, poznámka
- Pokud sponzor s daným emailem v systému neexistuje, automaticky se vytvoří nový User s rolí SPONSOR a výchozím heslem "sponsor123"
- Pokud existuje, vytvoří se pouze Sponsorship vazba
- Zamezení duplicitních aktivních sponzorství
- Každý sponzor zobrazuje: avatar, jméno, email, telefon, datum začátku, poznámka, status (Active/Inactive badge)
- **Tlačítko úprav** (ikona tužky) — otevře inline formulář: jméno, příjmení, **email** (editovatelný!), telefon, poznámka
- **Tlačítko odebrání sponzora** (ikona koše) — hard delete sponsorship s potvrzením
- Žluté pozadí karty sponzora (accent-50)

### 11.7 Platby od sponzorů
- Tlačítko "Přidat"
- Formulář: datum, typ platby (**dynamický dropdown** z číselníku PaymentType v administraci), částka + výběr měny (KES/CZK/EUR/USD), **sponzor (dropdown ze VŠECH aktivních sponzorů, načteno z `/api/sponsors`)**, poznámka
- Tabulka: datum, typ (barevný badge: zelený=školné, žlutý=lékař, červený=jiné), částka s měnou, sponzor, poznámka, ikona koše pro smazání
- Potvrzení před smazáním

### 11.8 Zdravotní prohlídky
- Tlačítko "Přidat prohlídku"
- Formulář: datum, typ (**dynamický dropdown** z číselníku HealthCheckType v administraci), poznámka
- Tabulka: datum (w-28) | typ prohlídky (w-24, barevný badge) | poznámka (zbytek prostoru) | ikona koše
- **Typ prohlídky posunut vlevo** aby poznámka měla maximum místa
- Potvrzení před smazáním

## 12. Stránka Sponzoři (/sponsors) — NOVÉ v Phase 9

### Přístup
- ADMIN, MANAGER, VOLUNTEER (ne SPONSOR)
- V sidebar: položka "Sponzoři" (ikona Heart) mezi Studenti a Platby

### UI: Card-based layout
- Vyhledávání s real-time filtrováním
- Tlačítko "Přidat sponzora" (vytvoří User s rolí SPONSOR, default heslo "sponsor123")
- Kontrola unikátnosti emailu (nabídne reaktivaci pokud existuje neaktivní sponzor)

### Karta sponzora obsahuje:
- Avatar (iniciály)
- Jméno, příjmení, email, telefon (inline editovatelné)
- Seznam přiřazených studentů (klikací odkazy na detail)
- Celkové platby seskupené po měnách (KES, CZK, USD, EUR)
- Tlačítko Deaktivovat/Reaktivovat (ADMIN/MANAGER) — deaktivace ukončí všechna aktivní sponzorství
- Neaktivní sponzoři: červený border + badge "Neaktivní"

### API endpointy
- **GET /api/sponsors** — seznam s platbami po měnách, ?search=, ?includeInactive=true
- **POST /api/sponsors** — vytvoření nového sponzora (User s rolí SPONSOR)
- **GET /api/sponsors/[id]** — detail s vazbami a platbami
- **PUT /api/sponsors/[id]** — editace info (jméno, email, telefon)
- **PATCH /api/sponsors/[id]** — toggle isActive
- **GET /api/sponsors/search?q=** — autocomplete hledání podle příjmení (top 10)

## 13. Stránka Platby (/payments) — CRUD

Plnohodnotná stránka se dvěma záložkami a kompletním CRUD:

### Tab switcher s ikonami
1. **Platby od sponzorů** (CreditCard ikona) — počet v závorce
2. **Zakoupené stravenky** (Ticket ikona) — počet v závorce

### Záložka "Platby od sponzorů"
- Nad tabulkou: barevné karty se součty po měnách (každá měna zvlášť: KES, CZK, EUR...)
- **Přidat platbu** (tlačítko +): formulář s dropdown pro studenta, sponzora, typ platby (z číselníku), měnu, částku, datum, poznámku
- **Editace** (ikona tužky, viditelná při hoveru): inline editace v řádku tabulky se selecty a inputy
- **Smazání** (ikona koše, viditelná při hoveru): s confirm dialogem
- Tabulka: datum, typ platby (badge), částka s měnou, student (odkaz), sponzor, poznámka, akce

### Záložka "Zakoupené stravenky"
- Nad tabulkou: celková částka (KES) a celkem nakoupených stravenek
- **Přidat stravenku** (tlačítko +): formulář s dropdown pro studenta, **sponzora (dropdown ze všech sponzorů, ne donorName textové pole)**, datum, částku, počet, poznámku
- **Editace** (ikona tužky): inline v řádku, **sponzor jako dropdown**
- **Smazání** (ikona koše): s confirm dialogem
- Tabulka: datum, částka, počet, student (odkaz), **sponzor (zobrazí jméno, fallback na donorName pro staré záznamy)**, poznámka, akce

### API endpoint
- **POST /api/payments** — vytvoření (type: 'sponsor' | 'voucher')
- **PUT /api/payments** — editace (type + id)
- **DELETE /api/payments** — smazání (type + id)

Data se načítají z `/api/dashboard` (sdílený endpoint, voucherPurchases include sponsor).

## 14. Administrace (/admin) — jen ADMIN

### Navigace
- V Sidebar: položka "Administrace" (ikona Settings), viditelná jen pro ADMIN
- Na stránce: tlačítko zpět (šipka → dashboard)

### Rozložení stránky — sbalitelný akordeon
Stránka obsahuje **3 sbalitelné sekce** (accordion). Každá sekce má:
- Klikací záhlaví s ikonou šipky (ChevronRight, rotace 90° při otevření)
- Název sekce + počet aktivních položek v závorce
- Kliknutím na záhlaví se sekce rozbalí/sbalí
- Výchozí stav: **Číselník tříd** je rozbalený, ostatní sbalené

### Znovupoužitelná komponenta CodelistSection
Všechny tři sekce sdílejí generickou komponentu `CodelistSection` s vlastnostmi:
- `title`, `icon`, `items`, `newItemName`, `onAdd`, `onDelete`, `onMove`
- Generický CRUD factory pattern `makeHandlers(endpoint, items)` pro DRY kód

### Sekce 1: Číselník tříd (ikona GraduationCap)
- **Přidání:** textový input + tlačítko "Přidat" (Enter = submit)
- **Seznam tříd:** každá třída = řádek s:
  - Šipky nahoru/dolů (ChevronUp/ChevronDown) pro změnu pořadí
  - Ikona GraduationCap + název třídy
  - Ikona koše pro smazání (viditelná při hoveru)
- **Mazání:** soft delete (isActive=false), při přidání stejného názvu se reaktivuje existující záznam
- **Řazení:** PUT endpoint aktualizuje sortOrder všech tříd najednou

### Sekce 2: Druhy zdravotních prohlídek (ikona Heart)
- Stejné UI jako číselník tříd (přidat, smazat, šipky pro řazení)
- Soft delete s reaktivací
- Výchozí seed data: Praktik, Zubař, Oční, Urgentní
- Použití: dropdown v záložce "Zdravotní prohlídky" v detailu studenta

### Sekce 3: Typy plateb od sponzorů (ikona CreditCard)
- Stejné UI jako číselník tříd (přidat, smazat, šipky pro řazení)
- Soft delete s reaktivací
- Výchozí seed data: Školné, Lékař, Uniforma, Učebnice, Jiné
- Použití: dropdown v záložce "Platby od sponzorů" v detailu studenta i na stránce Platby

### API endpointy pro číselníky
Všechny tři sdílejí stejný vzor (GET/POST/PUT/DELETE, jen ADMIN):

- **/api/admin/classrooms** — CRUD pro třídy
- **/api/admin/health-types** — CRUD pro druhy zdravotních prohlídek
- **/api/admin/payment-types** — CRUD pro typy plateb od sponzorů

Každý endpoint podporuje:
- GET: aktivní položky seřazené dle sortOrder
- POST: vytvoření nové (pokud existuje neaktivní se stejným jménem → reaktivace)
- PUT: batch update sortOrder (reordering)
- DELETE: soft delete (isActive=false)

## 15. API endpoints — kompletní přehled

### Autentizace
- POST /api/auth/login — přihlášení
- POST /api/auth/logout — odhlášení
- GET /api/auth/me — aktuální uživatel

### Dashboard
- GET /api/dashboard — stats (sponsorPaymentsByCurrency, voucherTotalAmount) + sponsorPayments (include student+sponsor) + voucherPurchases (include student+sponsor) + students (_count) + sponsors (sponsorships+student) + studentsWithNeeds

### Studenti
- GET /api/students — seznam s vyhledáváním a filtrováním
- POST /api/students — vytvoření s auto-generovaným studentNo
- GET /api/students/[id] — detail se všemi relacemi
- PUT /api/students/[id] — aktualizace osobních údajů
- DELETE /api/students/[id] — soft delete (isActive=false), jen ADMIN
- PUT /api/students/[id]/equipment — batch update vybavení
- POST /api/students/[id]/needs — přidání potřeby
- PUT /api/students/[id]/needs — toggle fulfilled
- DELETE /api/students/[id]/needs — smazání potřeby
- POST /api/students/[id]/vouchers — přidání nákupu nebo čerpání
- DELETE /api/students/[id]/vouchers — smazání nákupu nebo čerpání (query: type=purchase|usage)
- POST /api/students/[id]/health — přidání prohlídky
- DELETE /api/students/[id]/health — smazání prohlídky
- POST /api/students/[id]/photos — nahrání fotky (FormData: file, category, description, takenAt)
- DELETE /api/students/[id]/photos — smazání fotky (+ smazání souboru z disku)
- POST /api/students/[id]/sponsors — přidání sponzora (find or create User)
- PUT /api/students/[id]/sponsors — úprava sponzora (včetně emailu)
- DELETE /api/students/[id]/sponsors — hard delete sponsorship
- POST /api/students/[id]/sponsor-payments — přidání platby od sponzora
- DELETE /api/students/[id]/sponsor-payments — smazání platby

### Sponzoři
- GET /api/sponsors — seznam s platbami po měnách (?search=, ?includeInactive=true)
- POST /api/sponsors — vytvoření nového sponzora
- GET /api/sponsors/[id] — detail
- PUT /api/sponsors/[id] — editace
- PATCH /api/sponsors/[id] — toggle isActive
- GET /api/sponsors/search?q= — autocomplete (top 10)

### Platby (CRUD)
- POST /api/payments — vytvoření (type: sponsor | voucher)
- PUT /api/payments — editace (type + id)
- DELETE /api/payments — smazání (type + id)

### Admin
- GET/POST/PUT/DELETE /api/admin/classrooms
- GET/POST/PUT/DELETE /api/admin/health-types
- GET/POST/PUT/DELETE /api/admin/payment-types

## 16. Toast notifikace

- Úspěch: zelený toast vpravo nahoře, automaticky zmizí po 3 sekundách
- Chyba: červený toast vpravo nahoře, automaticky zmizí po 3 sekundách
- Funkce: `showMsg('success' | 'error', text)`

## 17. Potvrzovací dialogy

- Před uložením osobních údajů: modální dialog "Opravdu chcete uložit změny?" s tlačítky Zrušit/Uložit
- Před smazáním čehokoliv: `confirm()` dialog

## 18. Seed data (testovací data)

### Uživatelé
- Admin Rael (admin@rael.school / admin123) — ADMIN
- Manager Rael (manager@rael.school / manager123) — MANAGER
- Jana Nová (sponsor@example.com / sponsor123) — SPONSOR
- Dobrovolník Karel (volunteer@example.com / volunteer123) — VOLUNTEER

### Studenti (5 testovacích)
- RAEL-001 Amani Mwangi — plná data (vybavení, potřeby, stravenky, sponzor, zdravotní prohlídky, platby)
- RAEL-002 Zawadi Omondi
- RAEL-003 Jabari Kimani
- RAEL-004 Nia Wanjiku
- RAEL-005 Kofi Mutua

### Číselníky (seed data)
- **Třídy:** definované v seed.ts
- **Druhy zdravotních prohlídek:** Praktik, Zubař, Oční, Urgentní
- **Typy plateb od sponzorů:** Školné, Lékař, Uniforma, Učebnice, Jiné

## 19. Vizuální styl

- Zaoblené rohy (rounded-xl, rounded-2xl)
- Karty s border-gray-200 a hover efektem (card-hover: translateY(-2px), zvětšení stínu)
- Badge styly: badge-green (zelený), badge-yellow (žlutý), badge-red (červený)
- Gradient přihlašovací stránka (from-primary-600 to-primary-800)
- Custom scrollbar styling
- Loading spinner: border animace
- Všechen text #1a1a1a (vynuceno v globals.css přes *, body, p, span, h1-h6)
- Editace a mazání v tabulkách: ikony viditelné při hoveru nad řádkem (opacity-0 → group-hover:opacity-100)

## 20. Struktura souborů

```
rael-school/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/uploads/          (fotky studentů)
│   └── profiles/            (profilové fotky)
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx         (redirect na /login)
│   │   ├── login/page.tsx
│   │   ├── admin/page.tsx   (číselníky — jen ADMIN)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── students/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx     (seznam)
│   │   │   ├── new/page.tsx (nový student)
│   │   │   └── [id]/page.tsx (detail)
│   │   ├── sponsors/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx     (správa sponzorů)
│   │   ├── payments/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx     (CRUD plateb a stravenek)
│   │   ├── reports/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx     (placeholder)
│   │   └── api/
│   │       ├── auth/{login,logout,me}/route.ts
│   │       ├── admin/classrooms/route.ts
│   │       ├── admin/health-types/route.ts
│   │       ├── admin/payment-types/route.ts
│   │       ├── dashboard/route.ts
│   │       ├── payments/route.ts          (CRUD pro platby)
│   │       ├── sponsors/
│   │       │   ├── route.ts               (GET/POST)
│   │       │   ├── [id]/route.ts          (GET/PUT/PATCH)
│   │       │   └── search/route.ts        (GET autocomplete)
│   │       └── students/
│   │           ├── route.ts
│   │           └── [id]/
│   │               ├── route.ts
│   │               ├── equipment/route.ts
│   │               ├── needs/route.ts
│   │               ├── vouchers/route.ts
│   │               ├── health/route.ts
│   │               ├── photos/route.ts
│   │               ├── sponsors/route.ts  (POST/PUT/DELETE)
│   │               ├── sponsor-payments/route.ts
│   │               └── profile-photo/route.ts
│   ├── components/layout/Sidebar.tsx
│   ├── lib/
│   │   ├── db.ts            (Prisma singleton)
│   │   ├── auth.ts          (JWT, bcrypt, getCurrentUser, canEdit)
│   │   ├── i18n.ts          (createTranslator, dot notation, interpolace)
│   │   └── format.ts        (formatNumber, formatCurrency, formatDate, formatDateForInput, calculateAge)
│   └── messages/
│       ├── cs.json
│       ├── en.json
│       └── sw.json
├── .env                     (DATABASE_URL, JWT_SECRET)
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

## 21. Instalační postup

```bash
npm install
npm run setup    # = prisma generate + db push + seed
npm run dev
```

Aplikace běží na http://localhost:3000

## 22. Důležitá UX pravidla

1. Veškerý text v aplikaci musí být černý (#1a1a1a) — žádný šedý text pro hlavní obsah
2. Čísla formátovat s oddělovačem tisíců (mezerou)
3. Měna se zobrazuje za číslem: "1 500 KES"
4. Datum formátovat dle locale (cs: "12. 01. 2025", en: "12/01/2025")
5. Věk se počítá z data narození a zobrazuje jako "X let/years/miaka"
6. Potvrzovací dialogy před každým smazáním
7. Toast notifikace po každé akci (uložení/smazání) — funkce `showMsg()`
8. Edit mode indikátor (žlutý banner)
9. Responsivní design (mobil, tablet, desktop)
10. Prázdné stavy: ikona + text "Žádná data" centrovaně
11. Platby od sponzorů agregovat po měnách (KES, CZK, EUR zvlášť)
12. Stravenky jsou vždy v KES
13. Dropdown pro sponzory v platbách vždy načítá VŠECHNY aktivní sponzory (ne jen přiřazené ke studentovi)
14. Odebrání sponzora ze studenta = hard delete sponsorship (ne soft delete)

## 23. Aktuální stav projektu

### Hotové fáze (Phase 1–9)
- ✅ Autentizace a role (JWT, 4 role)
- ✅ Layout, navigace, sidebar s přepínačem jazyků
- ✅ Dashboard s klikacími kartami a záložkami
- ✅ Seznam studentů (grid, vyhledávání, kartičky)
- ✅ Detail studenta (8 záložek: osobní údaje, vybavení, potřeby, stravenky, fotografie, sponzoři, platby od sponzorů, zdravotní prohlídky)
- ✅ Nový student s auto-generováním čísla
- ✅ Trojjazyčné rozhraní (cs/en/sw)
- ✅ Admin číselníky (třídy, druhy prohlídek, typy plateb)
- ✅ Stránka Sponzoři (/sponsors) — CRUD, deaktivace/reaktivace
- ✅ Stránka Platby (/payments) — CRUD pro platby od sponzorů a stravenky

### Zatím neimplementováno
- ❌ Statistiky (/reports) — zatím placeholder
- ❌ Import plateb z banky
- ❌ Deployment / produkční nasazení

### Známé problémy
_(Doplňte sem případné známé bugy nebo nedostatky)_

## 24. Historie verzí

| Verze | Datum | Změny |
|-------|-------|-------|
| v1 | 8.2.2026 | Počáteční specifikace (Phase 1-6) |
| v2 | 10.2.2026 | Phase 7-8: Admin číselníky (třídy, druhy prohlídek, typy plateb) |
| v3 | 10.2.2026 | Phase 9: Sponzoři stránka, Payments CRUD, voucher sponsor dropdown, bugfixy |
| v4 | 11.2.2026 | Přechod na Claude Code: oddělení CLAUDE.md od specifikace, přidání stavu projektu |
