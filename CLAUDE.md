# Pravidla projektu

## Workflow pro změny kódu

1. **Udělej změnu kódu** podle pokynu uživatele
2. **Commitni a pushni** na GitHub (aby si uživatel mohl stáhnout změny)
3. **Pošli uživateli příkazy** pro aktualizaci na lokálním počítači:
   ```bash
   git pull origin <aktuální-branch>
   ```
   A připomeň restart dev serveru (Ctrl+C a `npm run dev`).
4. **Počkej** až uživatel otestuje změny na lokále
5. Pokud něco není v pořádku, **oprav a znovu pushni**

## Dokumentace

- Po každém commitu a push na GitHub aktualizuj dokumentaci projektu.
