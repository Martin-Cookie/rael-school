# Pravidla projektu

## Workflow pro změny kódu

1. **Udělej změnu kódu** podle pokynu uživatele
2. **Pošli uživateli příkazy** pro aktualizaci na lokálním počítači:
   ```bash
   git pull origin <aktuální-branch>
   ```
   A připomeň restart dev serveru (Ctrl+C a `npm run dev`).
3. **Počkej** až uživatel otestuje změny na lokále
4. **Zeptej se** jestli je vše v pořádku a zda má být provedeno commitnutí a push
5. **Commitni a pushni** až po výslovném schválení uživatele

## Dokumentace

- Po každém commitu a push na GitHub aktualizuj dokumentaci projektu.
