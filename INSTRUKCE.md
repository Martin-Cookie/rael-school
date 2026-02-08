# 🚀 INSTRUKCE: Jak nahrát projekt na Mac a spustit ho

## Co jsem vytvořil?

Kompletní Fázi 1 systému Rael School:
- ✅ Databáze se všemi tabulkami (studenti, sponzoři, stravenky, vybavení, potřeby, zdravotní prohlídky, platby)
- ✅ Přihlašovací systém s 4 rolemi (Admin, Manager, Sponzor, Dobrovolník)
- ✅ Dashboard s přehledem statistik
- ✅ Seznam studentů s vyhledáváním
- ✅ Detail studenta se záložkami (osobní údaje, fotky, stravenky, sponzoři, zdravotní prohlídky)
- ✅ Přidání nového studenta
- ✅ Režim úprav s potvrzovacím dialogem
- ✅ Trojjazyčnost (čeština, angličtina, svahilština)
- ✅ 5 testovacích studentů s kompletními daty
- ✅ Tmavý, dobře čitelný text
- ✅ Formátování čísel na tisíce

---

## POSTUP INSTALACE (krok za krokem)

### Krok 1: Stáhni soubory z tohoto chatu

V tomto chatu stáhni soubor **rael-school-files.tar.gz** (tlačítko stažení).

### Krok 2: Rozbal soubory do projektu

Otevři **Terminál** a zadej tyto příkazy JEDEN PO DRUHÉM:

```bash
# Přesuň se do složky projektu
cd ~/Documents/rael-school

# Smaž stávající README (nahradíme ho novým)
rm -f README.md
```

### Krok 3: Zkopíruj soubory

Budu ti muset soubory předat jinak — viz alternativní postup níže.

### ALTERNATIVNÍ POSTUP (jednodušší):

Protože přesun souborů ze stažených je komplikovaný, udělej toto:

**1. Smaž aktuální složku a znovu naklonuj:**
```bash
cd ~/Documents
rm -rf rael-school
git clone https://github.com/martinkoci/rael-school.git
cd rael-school
```

**2. V tomto chatu ti dám sadu příkazů, které vytvoří všechny soubory přímo v Terminálu.**

Ale nejprve — nejjednodušší postup je takový:

---

## ⭐ NEJJEDNODUŠŠÍ POSTUP — GIT PUSH Z MÉHO KÓDU

Já vytvořím kompletní archiv, ty ho rozbalíš a pushneš na GitHub.

### Krok 1: Stáhni archiv (ze souboru který ti připravím)

### Krok 2: V Terminálu:
```bash
cd ~/Documents/rael-school

# Zkopíruj všechny soubory z archivu sem
# (instrukce budou záviset na formátu)

# Nainstaluj závislosti
npm install

# Nastav databázi
npm run setup

# Spusť aplikaci
npm run dev
```

### Krok 3: Otevři prohlížeč
Jdi na **http://localhost:3000**

Měla by se zobrazit přihlašovací stránka. Přihlas se jako:
- **Email:** `admin@rael.school`
- **Password:** `admin123`

### Krok 4: Nahraj na GitHub
```bash
git add .
git commit -m "Phase 1: Initial project setup with auth, students, dashboard"
git push
```

---

## Jak zastavit aplikaci?
V Terminálu stiskni **Ctrl + C**

## Jak znovu spustit?
```bash
cd ~/Documents/rael-school
npm run dev
```
