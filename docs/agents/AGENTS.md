# Přehled agentů (Rael School)

> Všechny agenti leží v `docs/agents/`. Každý má popis v úvodu souboru a sekci **Spuštění** na konci.

## Meta-agenti (start session / koordinace)

| Agent | Soubor | Kdy spustit |
|-------|--------|-------------|
| **Session Start** | `SESSION-START.md` | Na začátku každé nové Claude Code session — rychlá orientace (co se naposledy dělalo, stav projektu) |
| **Orchestrator** | `ORCHESTRATOR.md` | Když nevíš co spustit jako první, nebo chceš komplexní údržbu projektu — koordinuje více agentů |

## Údržba a kvalita

| Agent | Soubor | Výstup | Kdy spustit |
|-------|--------|--------|-------------|
| **Code Guardian** | `CODE-GUARDIAN.md` | `AUDIT-REPORT.md` | Po bloku změn; periodicky (měsíčně); před releasem |
| **Doc Sync** | `DOC-SYNC.md` | Opravené `CLAUDE.md`, `docs/UI_GUIDE.md`, `README.md` | Po bloku změn (ideálně s Code Guardian) |
| **UX Optimizer** | `UX-OPTIMIZER.md` | `UX-REPORT.md` | Při zlepšování UX, po přidání nového modulu |
| **Test Agent** | `TEST-AGENT.md` | `TEST-REPORT.md` | Před releasem, po větší změně |
| **Backup Agent** | `BACKUP-AGENT.md` | `BACKUP-REPORT.md` | Periodicky (měsíčně); před změnou DB schematu |

## Release a nasazení

| Agent | Soubor | Kdy spustit |
|-------|--------|-------------|
| **Release Agent** | `RELEASE-AGENT.md` | Před vydáním nové verze (pre-release kontrola + tag) |
| **Cloud Deploy** | `CLOUD-DEPLOY.md` | Před přechodem z lokálu na cloud |

## Dokumentace / onboarding

| Agent | Soubor | Výstup | Kdy spustit |
|-------|--------|--------|-------------|
| **Business Logic** | `BUSINESS-LOGIC-AGENT.md` | `BUSINESS-LOGIC.md` + `BUSINESS-SUMMARY.md` | Před přepisem / migrací, onboarding nového vývojáře, předání projektu |

## Task Agent (automatický)

Task Agent je popsaný v `CLAUDE.md` (sekce "Pravidla pro práci na úkolech") — řídí každý úkol automaticky: plán → schválení → implementace → commit → report. Není třeba spouštět ručně.

---

## Doporučené workflow

### Denní práce
Zadávej úkoly → Task Agent se postará automaticky (plán, schválení, commit, report).

### Po bloku změn
1. **Code Guardian** — audit kódu
2. **Doc Sync** — aktualizovat dokumentaci
3. **UX Optimizer** (volitelně) — pokud se měnilo UI
4. Opravit kritické nálezy, commit, push

### Před releasem
1. **Test Agent** — kompletní funkční testy
2. **Code Guardian** — bezpečnostní a kvalitativní audit
3. **Backup Agent** — ověření záloh
4. **Doc Sync** — dokumentace aktuální?
5. **Release Agent** — pre-release + tag

### Periodická údržba (měsíčně)
Spusť **Orchestrator** → zvol "Kompletní průchod" → projdou všichni relevantní.

### Speciální situace
- Migrace / předání: **Business Logic Agent**
- Cloud nasazení: **Cloud Deploy Agent**

---

## Nový agent?

Pokud přidáváš nového:
1. Vytvoř `docs/agents/<NAME>.md` podle existujících vzorů
2. Na začátek přidej kontextový blok (stack, cesty, role)
3. Přidej do této tabulky
4. Pokud agent produkuje report, pojmenuj ho konzistentně (`XXX-REPORT.md`)
5. Uveď sekci `## Spuštění` s přesným příkazem na konci
