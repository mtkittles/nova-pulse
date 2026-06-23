# Kontrakt API Oracle (V2)

Strona czyta dane wyłącznie **server-side** przez `lib/oracle.ts` i adapter
`lib/oracle-map.ts`. Ten dokument opisuje aktualny kontrakt API Oracle oraz
aliasy, które adapter nadal akceptuje.

## Połączenie

- **Base URL:** wartość `ORACLE_API_URL` ustawiana w środowisku serwera.
- **Auth:** nagłówek `X-API-Key: <ORACLE_API_KEY>`.
- **`GET /health`** → `{"status":"ok"}` (bez klucza).

> Oracle nie jest wystawiany do przeglądarki. Strona korzysta wyłącznie z
> serwerowego proxy i nie liczy predykcji po swojej stronie.

## GET /public-api/tips/today

Typy na dziś, sort `match_date ASC, q_score DESC`.

```jsonc
{
  "date": "2026-06-04",
  "count": 16,
  "tips": [
    {
      "event_id": "af_991",
      "league": "…",
      "home": "…",
      "away": "…",
      "kickoff_utc": "2026-06-06T18:00:00Z",
      "bet_type": "BTTS|OVER_1_5|MIX|EXACT_32_23",
      "bet_side": "yes|no|32_or_23",
      "model_prob": 0.72,
      "odds": 1.85,
      "edge": 0.09,
      "q_score": 78,
      "actual_result": null
    }
  ]
}
```

**Mapowanie w `lib/oracle-map.ts` → typy strony:**

| Oracle           | Strona (`Tip`)        | Uwagi |
|------------------|-----------------------|-------|
| `home` / `home_team` | `home`            | alias history |
| `away` / `away_team` | `away`            | alias history |
| `kickoff_utc` / `match_date` | `kickoff_utc` | bez strefy adapter dopisuje `Z` |
| `bet_type`       | `bet_type`            | `O15`→`OVER_1_5`, `Mix`→`MIX`, `thriller`→`THRILLER` |
| `bet_side`       | `bet_side`            | `yes`→`TAK`, `no`→`NIE`, `32_or_23`→`3:2 / 2:3` |
| `actual_result` / `status` | `actual_result` | `pending`→`null`, `won`→`1`, `lost`→`0` |
| (brak)           | `edge`                | liczone: `model_prob − 1/odds` |

## GET /public-api/stats

```jsonc
{
  "generated_at": "2026-06-04T12:00:00Z",
  "range_days": 30,
  "summary": {
    "total_tips": 0,
    "settled_tips": 0,
    "wins": 0,
    "losses": 0,
    "win_rate": 0.0,
    "roi": 0,
    "current_streak": 0,
    "avg_q_score": null
  },
  "by_market": { "BTTS": {…}, "O15": {…}, "Mix": {…}, "thriller": {…} },
  "by_league": [ … ],
  "timeline": [ … ],
  "q_score_buckets": { "50-60": {…}, "60-70": {…}, "70-80": {…}, "80+": {…} }
}
```

Adapter konwertuje odpowiedź Oracle do typów używanych przez UI:

- `roi:null` przechodzi na `0`.
- `by_market` i `q_score_buckets` mogą przyjść jako obiekt albo tablica.
- `thriller` jest pomijany w widoku `by_market`.
- Legacy aliasy dalej działają, żeby nie psuć starego payloadu.

## Zmienne środowiskowe

Ustaw po stronie hostingu serwera:

- `ORACLE_API_URL` = baza Oracle ustawiona na serwerze (bez końcowego `/`)
- `ORACLE_API_KEY` = klucz z Oracle (`PUBLIC_API_KEY`)

> Jeśli `ORACLE_API_URL` wskazuje inny host, dokument powinien zostać
> zaktualizowany razem z audytem i planem.
