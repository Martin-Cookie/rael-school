# Test Agent – Automatické testování celé aplikace (Rael School)

> Spouštěj po bloku změn nebo před releasem pro ověření, že aplikace funguje správně.
> Agent projde 8 fází testování a vytvoří soubor TEST-REPORT.md se souhrnem výsledků.

---

## Cíl

Automaticky otestovat celou Rael School aplikaci — Jest/Vitest testy, Playwright E2E, 
route coverage, API endpointy, lokalizace, role-based přístup, dark mode a JS errory.
Na konci vytvořit TEST-REPORT.md s nálezem a prioritami.

## Instrukce

**NEPRAV ŽÁDNÝ KÓD. POUZE TESTUJ A REPORTUJ.**

Projdi postupně všech 8 fází. U každého selhání uveď:
- Co selhalo (test, URL, akce)
- Severity: CRITICAL / WARNING / INFO
- Detail (chybová hláška, screenshot, HTTP status)
- Doporučení jak to opravit

Na konci vytvoř souhrnnou tabulku a seřaď podle severity.

### Před spuštěním:

Ověř, že dev server běží:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

Pokud neběží:

```bash
cd /Users/martinkoci/Projects/rael-school && npm run dev &
```

---

## Fáze 1: UNIT TESTY (~1 min)

Spusť existující testy:

```bash
cd /Users/martinkoci/Projects/rael-school && npm test 2>&1
```

Zaznamenej:
- Celkový počet testů
- PASSED / FAILED / SKIPPED
- U selhání: název testu + chybová hláška
- Pokud žádné testy neexistují → INFO "Žádné unit testy"

---

## Fáze 2: BUILD CHECK (~2 min)

Ověř že se aplikace buildí bez chyb:

```bash
npm run build 2>&1
npm run lint 2>&1
```

Zaznamenej:
- Build: ✅ OK / ❌ FAIL + chyby
- Lint: ✅ OK / ⚠️ warnings / ❌ errors
- TypeScript chyby (pokud jsou)

---

## Fáze 3: PLAYWRIGHT SMOKE TESTY (~3 min)

Projdi klíčové stránky přes Playwright (browser_navigate + browser_snapshot):

| # | URL | Co ověřit |
|---|-----|-----------|
| 1 | /login | Login stránka se renderuje, formulář viditelný |
| 2 | /dashboard | Dashboard po přihlášení, stat karty viditelné |
| 3 | /students | Seznam studentů, tabulka s řádky |
| 4 | /students/[id] | Detail studenta, 9 tabů viditelných |
| 5 | /sponsors | Seznam sponzorů |
| 6 | /payments | Platby, filtry viditelné |
| 7 | /vouchers | Vouchery |
| 8 | /admin | Admin sekce (vyžaduje admin roli) |
| 9 | /tuition | Školné, summary karty |

Pro každou stránku:
- browser_navigate(url)
- browser_snapshot() — ověř že stránka obsahuje očekávané elementy
- Zaznamenej: ✅ OK / ❌ FAIL + důvod

---

## Fáze 4: ROLE-BASED PŘÍSTUP (~2 min)

Otestuj že role správně omezují přístup:

| Role | Přístup | Zakázáno |
|------|---------|----------|
| admin | Vše | — |
| manager | Studenti, sponzoři, platby, vouchery | Admin sekce |
| sponsor | Vlastní sponzorovaní studenti | Ostatní studenti, admin |
| volunteer | Omezený přístup | Admin, platby |

Pro každou roli:
- Přihlas se s danou rolí
- Pokus se o přístup na zakázanou stránku
- Ověř: redirect na /unauthorized nebo /login
- Zaznamenej: ✅ OK / ❌ FAIL

---

## Fáze 5: LOKALIZACE (~2 min)

Otestuj že všechny 3 jazyky fungují:

Pro každý jazyk (cs, en, sw):
- Přepni locale
- Ověř že se UI texty změní
- Zkontroluj zda nejsou missing translation keys (zobrazí se klíč místo textu)
- Ověř formátování měny (fmtCurrency)

Zaznamenej:
- ✅ Všechny překlady OK / ⚠️ Chybějící klíče [seznam]

---

## Fáze 6: API ENDPOINTY (~2 min)

Otestuj klíčové API routes:

```bash
# Příklady - uprav podle aktuálních rout
curl -s -w "%{http_code}" http://localhost:3000/api/students
curl -s -w "%{http_code}" http://localhost:3000/api/sponsors
curl -s -w "%{http_code}" http://localhost:3000/api/payments
```

Pro každý endpoint:
- HTTP status (200, 401, 404, 500)
- Validní JSON response
- Autentizace vyžadována (401 bez tokenu)

---

## Fáze 7: DARK MODE (~1 min)

Na každé stránce z fáze 3:
- Přepni dark mode toggle
- Ověř: třída `dark` na `<html>` elementu
- Vizuální kontrola: žádný bílý text na bílém pozadí, čitelnost
- Zaznamenej: ✅ OK / ⚠️ Problém [kde]

---

## Fáze 8: JS KONZOLE — CHYBY (~1 min)

Na každé stránce z fáze 3:

```
browser_console_messages(level="error")
```

Ignorovat known errors:
- Hydration warnings (Next.js development)
- favicon.ico 404

Zaznamenej:
- Stránky bez JS chyb → ✅
- Stránky s unknown JS chybami → ⚠️ WARNING + detail

---

## Formát výstupu

Vytvoř soubor **TEST-REPORT.md**:

```markdown
# Rael School Test Report – [YYYY-MM-DD]

## Souhrn

| Oblast | Stav | Detail |
|--------|------|--------|
| Unit testy | ✅/⚠️/❌ | X passed, Y failed |
| Build check | ✅/⚠️/❌ | Build OK, X lint warnings |
| Smoke testy | ✅/⚠️/❌ | X/9 stránek OK |
| Role-based přístup | ✅/⚠️/❌ | X/4 rolí OK |
| Lokalizace | ✅/⚠️/❌ | X/3 jazyků OK |
| API endpointy | ✅/⚠️/❌ | X/Y endpointů OK |
| Dark mode | ✅/⚠️/❌ | X stránek OK |
| JS konzole | ✅/⚠️/❌ | X stránek bez chyb |

**Celkový stav: ✅ PASS / ⚠️ VAROVÁNÍ / ❌ SELHÁNÍ**

## Detaily selhání
...

## Doporučení
1. [Prioritní opravy]
2. [Vylepšení]
3. [Další kroky]
```

---

## Úklid po testování

```bash
rm -rf .playwright-mcp/*.log .playwright-mcp/*.png .playwright-mcp/*.jpeg
rm -f *.png *.jpeg
```

---

## Spuštění

```
Přečti TEST-AGENT.md a proveď kompletní testování projektu. Výstupem je TEST-REPORT.md. Nic neopravuj, pouze testuj a reportuj.
```
