# Kontrakt API Oracle (Lupus Bot → LUPUS BETS)

Strona czyta dane przez **dwa endpointy** wystawione po stronie bota na Oracle,
za **Cloudflare Tunnel + klucz API**. To dokument referencyjny do zbudowania
ich w sesji na Oracle (`/home/ubuntu/betting-predictor`).

## Zasady (z CLAUDE.md bota)

- **Osobny proces** od bota — API nie może crashować bota.
- **Serwuj policzone, nie licz na żądanie.** Zwracaj gotowe rekordy z
  `bot_predictions` / gotowe agregaty (np. odświeżane cyklicznie / cache).
- **Klucz API** wymagany w nagłówku. Oracle nie jest wystawiony wprost do
  internetu — tylko przez Cloudflare Tunnel.

## Uwierzytelnianie

Każde żądanie ze strony ma nagłówek:

```
x-api-key: <ORACLE_API_KEY>
```

Endpoint odrzuca brak/niepoprawny klucz (`401`).

---

## 1) GET /public-api/tips/today

Zwraca dzisiejsze typy.

```jsonc
{
  "date": "2026-06-04",
  "tips": [
    {
      "event_id": 12345,
      "league": "Premier League",
      "home": "Arsenal",
      "away": "Chelsea",
      "kickoff_utc": "2026-06-04T19:00:00Z",
      "bet_type": "BTTS",        // BTTS | OVER_1_5 | MIX | THRILLER
      "bet_side": "YES",
      "model_prob": 0.71,         // 0..1
      "odds": 1.65,
      "edge": 0.08,               // np. 0.08 = +8%
      "q_score": 82,              // 0..100
      "actual_result": null       // null przed meczem, 1 = trafione, 0 = pudło
    }
  ]
}
```

## 2) GET /public-api/stats

Zwraca **gotowe agregaty** skuteczności (np. ostatnie 30 dni, tylko rozliczone
typy: `actual_result IS NOT NULL`).

```jsonc
{
  "generated_at": "2026-06-04T11:30:00Z",
  "range_days": 30,
  "summary": {
    "total_tips": 194, "settled_tips": 194,
    "wins": 117, "losses": 77,
    "win_rate": 0.603,            // 0..1
    "roi": 0.049,                 // np. 0.049 = +4.9% (płaska stawka 1u)
    "current_streak": 2,          // + wygrane / - przegrane z rzędu
    "avg_q_score": 68
  },
  "timeline": [
    { "date": "2026-05-06", "win_rate": 0.60, "roi": 0.03, "tips": 6 }
    // ... punkt na dzień, skumulowany win_rate i roi
  ],
  "by_market": [
    { "bet_type": "BTTS", "tips": 78, "win_rate": 0.64, "roi": 0.09 },
    { "bet_type": "OVER_1_5", "tips": 71, "win_rate": 0.71, "roi": 0.07 },
    { "bet_type": "MIX", "tips": 33, "win_rate": 0.55, "roi": 0.14 }
  ],
  "by_league": [
    { "league": "Premier League", "tips": 41, "win_rate": 0.68 }
    // ...
  ],
  "q_score_buckets": [
    { "bucket": "50–60", "tips": 38, "win_rate": 0.52 },
    { "bucket": "60–70", "tips": 57, "win_rate": 0.61 },
    { "bucket": "70–80", "tips": 49, "win_rate": 0.68 },
    { "bucket": "80–90", "tips": 28, "win_rate": 0.77 },
    { "bucket": "90–100", "tips": 11, "win_rate": 0.84 }
  ]
}
```

## Mapowanie pól z `bot_predictions`

| Pole API        | Źródło w bocie                                   |
|-----------------|--------------------------------------------------|
| `event_id`      | `bot_predictions.event_id`                       |
| `league`        | join przez mecz → `League.name`                  |
| `home` / `away` | join → `Team.name` (gospodarz/gość)              |
| `kickoff_utc`   | `Match.utc_date` (ISO 8601, UTC, z `Z`)          |
| `bet_type`      | `bet_type` znormalizowany do enuma (patrz niżej) |
| `bet_side`      | `bet_side`                                        |
| `model_prob`    | `model_prob` (0..1)                              |
| `odds`          | `odds`                                            |
| `edge`          | `edge`                                            |
| `q_score`       | `q_score` (0..100)                              |
| `actual_result` | `actual_result` (NULL/1/0)                       |

**Normalizacja `bet_type`** do: `BTTS`, `OVER_1_5`, `MIX`, `THRILLER`
(np. „Over 1.5" → `OVER_1_5`, „Thriller 3:2/2:3" → `THRILLER`).

## Szkic implementacji (FastAPI, osobny proces)

```python
# public_api.py — uruchamiać osobno od bota (np. uvicorn na 127.0.0.1:8088),
# Cloudflare Tunnel kieruje na ten port. NIE importować pętli bota.
import os, sqlite3
from datetime import date
from fastapi import FastAPI, Header, HTTPException

app = FastAPI()
API_KEY = os.environ["PUBLIC_API_KEY"]
DB = "data/betting.db"

def auth(x_api_key: str | None):
    if x_api_key != API_KEY:
        raise HTTPException(401, "bad key")

def db():
    con = sqlite3.connect(DB)            # tylko ODCZYT
    con.row_factory = sqlite3.Row
    return con

@app.get("/public-api/tips/today")
def tips_today(x_api_key: str | None = Header(default=None)):
    auth(x_api_key)
    con = db()
    rows = con.execute("""
        SELECT p.event_id, l.name AS league, th.name AS home, ta.name AS away,
               m.utc_date AS kickoff_utc, p.bet_type, p.bet_side,
               p.model_prob, p.odds, p.edge, p.q_score, p.actual_result
        FROM bot_predictions p
        JOIN matches m ON m.id = p.event_id          -- dostosuj nazwy tabel/kolumn
        JOIN teams th ON th.id = m.home_team_id
        JOIN teams ta ON ta.id = m.away_team_id
        JOIN leagues l ON l.id = m.league_id
        WHERE DATE(m.utc_date) = DATE('now')
        ORDER BY p.q_score DESC
    """).fetchall()
    return {"date": date.today().isoformat(), "tips": [dict(r) for r in rows]}

@app.get("/public-api/stats")
def stats(x_api_key: str | None = Header(default=None)):
    auth(x_api_key)
    # Najlepiej: zwracać AGREGATY policzone wcześniej (cron/po weryfikacji),
    # zapisane np. do data/stats_cache.json — zamiast liczyć na każde żądanie.
    ...
```

> Nazwy tabel/kolumn (`matches`, `teams`, `home_team_id`, …) dopasuj do realnego
> ORM bota (`database/models.py`).

## Cloudflare Tunnel + zmienne na Vercel

1. Na Oracle: `cloudflared tunnel` kieruje publiczny URL → `127.0.0.1:8088`.
2. Na Vercel (Settings → Environment Variables):
   - `ORACLE_API_URL` = publiczny URL tunelu (bez końcowego `/`)
   - `ORACLE_API_KEY` = ten sam klucz co `PUBLIC_API_KEY` na Oracle
3. Redeploy. Strona automatycznie przełączy się z mocka na dane na żywo
   (plakietka „dane testowe" zniknie).
