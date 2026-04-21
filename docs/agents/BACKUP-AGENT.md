# Backup Agent – Kontrola záloh databáze (Rael School)

> Spouštěj periodicky (např. měsíčně) nebo před změnami v DB struktuře.
> Agent ověří, že zálohy v git repozitáři jsou konzistentní a obnova funguje.

---

## Kontext projektu

Rael School používá **git-based backup**: zálohy SQLite DB jsou fyzicky committované v git repozitáři.

| Soubor | Účel |
|--------|------|
| `prisma/dev.db` | Aktuální lokální DB (v `.gitignore`) |
| `prisma/dev.db.primary` | **Plná záloha** (committována) — obsahuje runtime data (předpisy, platby, stravenky…) |
| `prisma/dev.db.backup` | Demo data — 30 testovacích studentů (committována) |
| `prisma/seed.ts` | Seed script (148 studentů, číselníky, sazby) |
| `prisma/seed-demo.ts` | Demo seed (30 studentů) |
| `data/students-real.json` | Zdrojová data — 148 studentů |
| `data/config-real.json` | Zdrojová data — číselníky |

**Pozn.:** Žádný cloud backup, žádný ZIP systém, žádný SMTP. Jednoduchý git workflow.

---

## Cíl

Ověřit, že:
1. `dev.db.primary` je integrní a commitnutý v gitu
2. Obnova z `dev.db.primary` funguje (`cp prisma/dev.db.primary prisma/dev.db`)
3. `prisma db push` neztrácí data (schema drift check)
4. Seed (`npm run db:seed`) funguje na čisté DB a vytvoří očekávaný počet záznamů
5. Zdrojová data (`students-real.json`, `config-real.json`) jsou aktuální
6. Demo data (`dev.db.backup`) stále fungují

**NEPRAV ŽÁDNÝ KÓD. POUZE TESTUJ A REPORTUJ.**

---

## Postup

### Fáze 1: INTEGRITA ZÁLOHOVACÍCH SOUBORŮ

#### 1.1 Existence a tracking v gitu
```bash
ls -la prisma/dev.db*
git ls-files prisma/ | grep -i db
git log --oneline -5 -- prisma/dev.db.primary
git log --oneline -5 -- prisma/dev.db.backup
```

Zaznamenej:
- `dev.db.primary` existuje? ✅/❌
- `dev.db.primary` committovaný? ✅/❌
- Poslední commit na `dev.db.primary` — kdy? (pokud starší než měsíc → WARNING)
- Velikost (ne 0 B, ne extrémně velká)

#### 1.2 SQLite integrity check
```bash
sqlite3 prisma/dev.db.primary "PRAGMA integrity_check;"
sqlite3 prisma/dev.db.backup "PRAGMA integrity_check;"
```
Očekávaný výstup: `ok`. Cokoli jiného = poškozená záloha.

#### 1.3 Obsah zálohy — počty klíčových tabulek
```bash
sqlite3 prisma/dev.db.primary <<'EOF'
SELECT 'Student' AS tbl, COUNT(*) FROM Student
UNION ALL SELECT 'Sponsor', COUNT(*) FROM Sponsor
UNION ALL SELECT 'Sponsorship', COUNT(*) FROM Sponsorship
UNION ALL SELECT 'SponsorPayment', COUNT(*) FROM SponsorPayment
UNION ALL SELECT 'VoucherPurchase', COUNT(*) FROM VoucherPurchase
UNION ALL SELECT 'TuitionCharge', COUNT(*) FROM TuitionCharge
UNION ALL SELECT 'PaymentImport', COUNT(*) FROM PaymentImport
UNION ALL SELECT 'User', COUNT(*) FROM User;
EOF
```

Očekávaná minima (podle CLAUDE.md):
- Student ≥ 148
- Sponsor ≥ 137
- Sponsorship ≥ 160
- User ≥ 4 (admin, manager, sponsor, volunteer)

---

### Fáze 2: SCHEMA DRIFT

Zkontroluj, zda aktuální `prisma/schema.prisma` odpovídá struktuře v `dev.db.primary`:

```bash
cp prisma/dev.db.primary /tmp/rael-test-restore.db
DATABASE_URL="file:/tmp/rael-test-restore.db" npx prisma db push --skip-generate 2>&1 | tail -20
```

Zaznamenej:
- Prisma hlásí "already in sync"? ✅
- Hlásí nové/smazané sloupce? ⚠️ (schema se od zálohy posunul — záloha už neodpovídá aktuální verzi, je třeba aktualizovat `dev.db.primary`)

---

### Fáze 3: TEST OBNOVY

**POZOR: Testuj na kopii, ne na aktuální `dev.db`!**

```bash
# 1. Záloha aktuálního stavu
cp prisma/dev.db /tmp/rael-current-backup.db

# 2. Simulace obnovy z primary
cp prisma/dev.db.primary prisma/dev.db
npx prisma db push --skip-generate 2>&1
```

Spusť `npm run dev` (v pozadí) a ověř:
- Server startuje bez chyb
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200/302
- Login jako admin (admin@rael.school / admin123) funguje
- `/students` vypisuje správný počet studentů
- `/sponsors` vypisuje sponzory

Po testu:
```bash
cp /tmp/rael-current-backup.db prisma/dev.db
rm /tmp/rael-current-backup.db /tmp/rael-test-restore.db
```

---

### Fáze 4: TEST SEEDU NA ČISTÉ DB

```bash
cp prisma/dev.db /tmp/rael-seed-backup.db
rm prisma/dev.db
npx prisma db push --skip-generate
npm run db:seed 2>&1 | tail -30
```

Ověř:
- Seed proběhl bez chyb
- Počty odpovídají CLAUDE.md (148 studentů, 137 sponzorů, 160 sponzorství, 224 vybavení, 31 zdrav. prohlídek)
- Uživatelé existují (admin, manager, sponzor, volunteer)
- Číselníky: třídy PP1–Grade 12, typy plateb, TuitionRate, VoucherRate

Po testu:
```bash
cp /tmp/rael-seed-backup.db prisma/dev.db
rm /tmp/rael-seed-backup.db
```

---

### Fáze 5: ZDROJOVÁ DATA

- `data/students-real.json` existuje a je JSON-validní?
- `data/config-real.json` existuje a je JSON-validní?
- Když byly naposledy změněny? (`git log -1 --format="%ai" -- data/students-real.json`)
- Reflektují se v `dev.db.primary`? (počty sedí)

---

### Fáze 6: ROLLING BACKUP POLICY (audit)

Ne-automatické otázky:
- Existuje proces aktualizace `dev.db.primary` po vytvoření důležitých runtime dat?
- V CLAUDE.md je sekce "Aktualizace primární zálohy" — je stále přesná?
- Jak staré je nejstarší nebezpečné "mezidobí" (dev.db má data, primary je starší)?

---

## Formát reportu

Vytvoř/aktualizuj `BACKUP-REPORT.md` v rootu:

```markdown
# Rael School – Backup Report – YYYY-MM-DD

## Souhrn

| Kontrola | Stav |
|----------|------|
| `dev.db.primary` existuje a commitnutý | ✅/❌ |
| `dev.db.backup` existuje a commitnutý | ✅/❌ |
| SQLite integrity check (primary) | ✅/❌ |
| SQLite integrity check (backup) | ✅/❌ |
| Schema drift (primary vs schema.prisma) | ✅ žádný / ⚠️ drift / ❌ selhání |
| Test obnovy (app startuje, login funguje) | ✅/❌ |
| Test seedu (čistá DB + `npm run db:seed`) | ✅/❌ |
| Zdrojová data (JSON) validní | ✅/❌ |

**Celkový stav: ✅ OK / ⚠️ VAROVÁNÍ / ❌ SELHÁNÍ**

## Detaily

### Velikosti a timestampy
| Soubor | Velikost | Poslední commit |
|--------|----------|-----------------|
| `prisma/dev.db.primary` | X MB | YYYY-MM-DD |
| `prisma/dev.db.backup` | X MB | YYYY-MM-DD |

### Počty v primary
- Student: X (očekáváno ≥ 148)
- Sponsor: X (očekáváno ≥ 137)
- ...

### Nalezené problémy
| # | Problém | Severity | Doporučení |
|---|---------|----------|------------|
| 1 | ...     | ...      | ...        |

## Doporučení
- [co zlepšit]
```

---

## Spuštění

```
Přečti docs/agents/BACKUP-AGENT.md a proveď kontrolu záloh. Testuj na kopiích, nikdy na aktuální dev.db.
```
