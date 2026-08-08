# `/typy` — filtr „Tylko value" — analiza logiki

**Repo:** `mtkittles/nova-pulse` · **Data:** 2026-08-03
**Zakres:** wyłącznie odczyt kodu, bez zmian.

---

## Gdzie żyje

Cała logika w jednym pliku: **`components/typy-page.tsx`**. Brak duplikatów w innych komponentach.

## Kryterium (co odrzuca typ)

```tsx
// components/typy-page.tsx:190
.filter((t) => (valueOnly ? t.edge != null && t.edge > 0 : true))
```

**Typ przechodzi wtedy i tylko wtedy, gdy `Tip.edge` jest ściśle dodatni.**
Odrzucane:
- `edge == null` (nieznana wartość — brak danych, brak `model_prob`/`odds`),
- `edge == 0` (brak przewagi),
- `edge < 0` (bukmacher wycenia lepiej niż nasz model).

Nie ma tu suwaka progu — binary: „value" vs „wszystko".

## Stan przełącznika — default

```tsx
// components/typy-page.tsx:124-125
// P0/S2: jawny przełącznik value zamiast ukrytego minEdge=0.
// Domyślnie tylko value (edge > 0).
const [valueOnly, setValueOnly] = useState(true)
```

`valueOnly = true` po wejściu na `/typy`. Aby zobaczyć typy z ujemnym/zerowym/nieznanym edge trzeba świadomie kliknąć „Wszystkie analizy".

## Skąd bierze się pole `edge`

Ustawiane raz w adapterze — **`lib/oracle-map.ts:125-127`** w `adaptTip`:

```tsx
const edge =
  numOrNull(t.edge) ??
  (model_prob != null && odds != null && odds > 0 ? model_prob - 1 / odds : null)
```

Kolejność:
1. **Preferuje `edge` z Oracle** (może być ujemny; adapter go zachowuje).
2. Fallback: gdy Oracle nie podał edge, ale są `model_prob` + `odds > 0` → liczy klasyczną przewagę nad kursem `p − 1/odds`.
3. Gdy i tego brak → `null`.

## UI toggle

```tsx
// components/typy-page.tsx:288-304 (uproszczone)
<div className="inline-flex rounded-full border ... p-0.5 text-sm">
  <button onClick={() => setValueOnly(true)}
    className={`... ${valueOnly ? "bg-[var(--cyan-soft)]" : ""}`}>
    Tylko value
  </button>
  <button onClick={() => setValueOnly(false)}
    className={`... ${!valueOnly ? "bg-[var(--cyan-soft)]" : ""}`}>
    Wszystkie analizy
  </button>
</div>
```

Dwustanowy toggle, wzajemnie się wykluczają. Podświetlony aktywny (`--cyan-soft`).

## Tabela zbiorcza

| aspekt | wartość |
|---|---|
| plik | `components/typy-page.tsx` |
| pole filtra | `Tip.edge` |
| próg | `edge != null && edge > 0` (ściśle dodatni, **nie** `≥ 0`) |
| default UI | `valueOnly = true` (filtr AKTYWNY po wejściu) |
| co jest odrzucane | `edge` ujemny, zerowy, `null` |
| gdzie liczony edge | `adaptTip` w `lib/oracle-map.ts` (Oracle → fallback `p − 1/odds`) |
| suwak / próg liczbowy | **brak** — binary toggle |

## Uwaga historyczna

Komentarz w kodzie (`P0/S2`): wcześniej istniał ukryty `minEdge=0` — zamieniony na jawny przełącznik, żeby użytkownik wiedział, że coś jest odfiltrowane. To decyzja produktowa: ukryte filtry mylą.

## Potencjalne skutki dla UX

- Typy z `edge = null` (Oracle nie policzył + brak `model_prob`/`odds` do fallback'a) **nigdy nie pokażą się przy domyślnym `Tylko value`**, nawet jeśli mają wysoki Q-Score. Do świadomej weryfikacji: przełącz na „Wszystkie analizy".
- Typy z `edge = 0` (dokładne match model↔kurs) też są odrzucane — świadomy wybór („value" = **strict** dodatni).
