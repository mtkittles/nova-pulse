# Kontrakt API Oracle (Lupus Bot → LUPUS BETS)

Strona czyta dane przez **dwa endpointy** wystawione przez `lupus-api` (FastAPI)
na Oracle. To dokumentacja **realnego** kształtu odpowiedzi. Strona mapuje go na
swoje typy w `lib/oracle-map.ts` (adapter), więc różnice nazw pól są obsłużone.

## Połączenie

- **Base URL:** `http://92.5.152.209:8088` (stały IP Oracle; zastąpił Cloudflare Tunnel)
- **Auth:** nagłówek `X-API-Key: <ORACLE_API_KEY>` (= `PUBLIC_API_KEY` z `.env` na Oracle)
- **`GET /health`** → `{"status":"ok"}` (bez klucza)

> Bot na Oracle jest **nienaruszalny**. Strona łączy się tylko przez to HTTP API.

## GET /public-api/tips/today

Typy na dziś + następne dni, sort `match_date ASC, q_score DESC`.

```jsonc
{
  "date": "2026-06-04",
  "count": 16,
  "tips": [
    {
      "event_id": "af_991",
      "home_team": "…", "away_team": "…",
      "league": "…",
      "match_date": "2026-06-06T18:00:00",   // bez strefy → traktowane jako UTC
      "bet_type": "BTTS|O15|Mix|thriller",
      "bet_side": "yes|no|32_or_23",
      "model_prob": 0.72,
      "odds": 1.85,
      "q_score": 78,
      "status": "pending|won|lost"
    }
  ]
}
```

**Mapowanie w `lib/oracle-map.ts` → typy strony:**

| Oracle           | Strona (`Tip`)        | Uwagi |
|------------------|-----------------------|-------|
| `home_team`      | `home`                | |
| `away_team`      | `away`                | |
| `match_date`     | `kickoff_utc`         | dodaje `Z`, jeśli brak strefy |
| `bet_type`       | `bet_type`            | `O15`→`OVER_1_5`, `Mix`→`MIX`, `thriller`→`THRILLER` |
| `bet_side`       | `bet_side`            | `yes`→`TAK`, `no`→`NIE`, `32_or_23`→`3:2 / 2:3` |
| `status`         | `actual_result`       | `pending`→`null`, `won`→`1`, `lost`→`0` |
| (brak)           | `edge`                | liczone: `model_prob − 1/odds` |

## GET /public-api/stats

```jsonc
{
  "summary": { "total": 0, "won": 0, "lost": 0, "win_rate": 0.0, "roi": null, "period_days": 30 },
  "by_market": { "BTTS": {…}, "O15": {…}, "Mix": {…}, "thriller": {…} },  // OBIEKT
  "by_league": [ … ],                                                      // tablica
  "timeline":  [ … ],                                                      // tablica
  "q_score_buckets": { "50-60": {…}, "60-70": {…}, "70-80": {…}, "80+": {…} } // OBIEKT
}
```

Adapter konwertuje `by_market` i `q_score_buckets` z obiektu na tablice, `roi:null`
na `0`, i pomija `thriller` w `by_market`. Gdy baza się zapełni (auto-weryfikacja
po rozegranych meczach), wartości przestaną być zerowe.

## Zmienne na Vercel

Ustaw dla **Production + Preview + Development** (Settings → Environment Variables),
potem **Redeploy**:

- `ORACLE_API_URL` = `http://92.5.152.209:8088` (bez końcowego `/`)
- `ORACLE_API_KEY` = klucz z Oracle (`PUBLIC_API_KEY`)

> Jeśli `/health` nie odpowiada: otwórz port 8088 (Oracle Cloud → VCN → Security
> Lists → Ingress TCP 8088, `0.0.0.0/0`) oraz `sudo iptables -I INPUT -p tcp --dport 8088 -j ACCEPT`.
