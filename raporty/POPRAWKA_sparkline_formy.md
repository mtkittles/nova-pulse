# Poprawka — wykres formy: amplituda + kolor highlightu

**Branch:** `claude/determined-galileo-1Vsu7` (nie mergowane do main)
**Plik:** `components/form-panel.tsx` (`FormSparkline`)
**Zakres:** wyłącznie front/CSS/props recharts — bez zależności od kontraktu
API, więc bez potrzeby weryfikacji na żywych danych.

## Zmiany

1. **Wysokość kontenera:** `h-12` (48px) → `h-16` (64px) — sam wzrost
   wysokości już wizualnie powiększa amplitudę pików.
2. **Interpolacja:** `type="monotone"` → `type="linear"` — ostre, kanciaste
   przejścia W/D/L zamiast wygładzonych krzywych, które spłaszczały
   wrażenie zmienności formy (monotone zaokrągla wierzchołki).
3. **Domena Y:** `[-0.1, 1.1]` → `[-0.05, 1.05]` — ciaśniej wokół realnych
   wartości (0/0.5/1), więc te same dane zajmują większy % wysokości
   wykresu.
4. **Grubość linii:** `strokeWidth={2}` → `strokeWidth={2.5}`.
5. **Kolor highlightu (hover):** dodany jawny `activeDot={{ r: 5, fill:
   "#58E6F5", stroke: "#03050a", strokeWidth: 1.5 }}` — wcześniej `<Line>`
   nie miał ustawionego `activeDot` wprost, więc renderer opierał się na
   domyślnym zachowaniu recharts. Teraz stan hover jest jawnie akcentowym
   cyanem (`#58E6F5`, ten sam co reszta designu), wyraźnie odróżnialnym od
   zielono-czerwonej konwencji BTTS (`BttsDot`, ustalonej w poprzedniej
   sesji: zielony = BTTS tak, czerwony = BTTS nie) i od zielono-żółto-
   czerwonej konwencji W/D/L (`FORM_COLOR`).

Żadna z tych zmian nie modyfikuje samych danych (`v = W?1 : D?0.5 : 0`) —
tylko sposób ich renderowania.

## Diff

```diff
   if (data.length < 2) return null
   return (
-    <div className="mb-1.5 h-12 w-full">
+    <div className="mb-1.5 h-16 w-full">
       <ResponsiveContainer width="100%" height="100%">
         <LineChart data={data} margin={{ top: 6, right: 4, bottom: 6, left: 4 }}>
-          <YAxis hide domain={[-0.1, 1.1]} />
+          {/* domena ciasno wokół realnych wartości (0/0.5/1) — większa
+              amplituda pików niż poprzednie -0.1..1.1; type="linear" (nie
+              monotone) — ostre, kanciaste piki W/D/L zamiast wygładzonych
+              krzywych, które spłaszczały wrażenie zmienności formy. */}
+          <YAxis hide domain={[-0.05, 1.05]} />
           <Tooltip content={<SparkTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
-          <Line type="monotone" dataKey="v" stroke="#58E6F5" strokeWidth={2} dot={<BttsDot />} isAnimationActive={false} />
+          <Line
+            type="linear"
+            dataKey="v"
+            stroke="#58E6F5"
+            strokeWidth={2.5}
+            dot={<BttsDot />}
+            activeDot={{ r: 5, fill: "#58E6F5", stroke: "#03050a", strokeWidth: 1.5 }}
+            isAnimationActive={false}
+          />
         </LineChart>
       </ResponsiveContainer>
     </div>
```

## Build i weryfikacja

- `npx tsc --noEmit` — czysto.
- `npm run build` — czysto (14/14 stron).
- Backup pliku sprzed zmiany: `raporty/backup-2026-08-24/form-panel.tsx.bak`.

## Zadanie 2/2 tej sesji — status

Druga poprawka z tego samego zlecenia (kod ligi → pełna nazwa + flaga na
kartach `/typy`) jest **w toku**: zdiagnozowana przez czytanie kodu
(`MatchTipCard` re-derywuje nazwę ligi po stronie klienta funkcją, która
zależy od słownika wypełnianego wyłącznie server-side), ale zgodnie z
poleceniem („zweryfikuj kontrakt na żywych danych przed kodowaniem") czeka
na potwierdzenie realnych danych (`/api/tips`, `/api/leagues-names` na
preview) przed napisaniem diffu. Osobny raport po otrzymaniu tych danych.
