# Pravidla projektu

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

## Kritické technické konvence

- Next.js 14 **NEPOUŽÍVÁ** `use(params)` hook — params jsou synchronní objekt `{ params: { id: string } }`, ne Promise
- Auth funkce: `getCurrentUser()` z `@/lib/auth`
- Toast notifikace: `showMsg('success' | 'error', text)`
- Čísla formátovat s oddělovačem tisíců (mezerou): `1 000` ne `1000`
- Měna za číslem: `1 500 KES`
- Stravenky jsou vždy v KES
- Každý nový text v UI musí mít klíč ve **všech třech** jazycích (cs, en, sw)

## Uživatelské role

| Role | Práva |
|------|-------|
| ADMIN | Plný přístup, správa uživatelů, mazání |
| MANAGER | Editace studentů, přidávání dat, přehledy |
| SPONSOR | Pouze své přiřazené studenty (read-only) |
| VOLUNTEER | Editace studentů, přidávání dat |
