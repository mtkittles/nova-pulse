# Deep-link logowanie (Telegram) — instrukcja dla bota

Strona generuje token, otwiera `https://t.me/<bot>?start=lb_<TOKEN>`.
Bot dostaje `/start lb_<TOKEN>`, wyciąga token, dzwoni do strony z danymi
użytkownika. Strona ustawia sesję i przeglądarka się przeloguje (polling).

## Co bot musi zrobić

Po komendzie `/start <param>`:

1. Jeśli `param` zaczyna się od `lb_` → wyciągnij `token = param[3:]`.
2. POST do strony:
   - URL: `${PUBLIC_SITE_URL}/api/auth/callback`
   - nagłówek: `X-Bot-Secret: ${BOT_CALLBACK_SECRET}`
   - body JSON:
     ```json
     {
       "token": "<token>",
       "telegram_id": <id>,
       "first_name": "<first_name>",
       "last_name":  "<last_name>",
       "username":   "<username>"
     }
     ```
3. Odpowiedz na czacie:
   - `200` → „✅ Zalogowano w przeglądarce. Wracaj do strony."
   - `401/404` → „Link wygasł, spróbuj ponownie na stronie."

## Zmienne na Oracle (`.env` bota)

- `PUBLIC_SITE_URL` — np. `https://nova-pulse.vercel.app`
- `BOT_CALLBACK_SECRET` — TEN SAM napis co na Vercel (sekret).

## Zmienne na Vercel

Już ustawione albo do dodania:
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Upstash → Create Redis → free, REST tokens)
- `BOT_CALLBACK_SECRET` — losowy ciąg (`openssl rand -base64 32`)
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — nazwa bota bez `@`

## Szkic implementacji (python-telegram-bot, dla Lupus Bota)

```python
import os, requests
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

SITE   = os.environ["PUBLIC_SITE_URL"].rstrip("/")
SECRET = os.environ["BOT_CALLBACK_SECRET"]

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args or []
    if args and args[0].startswith("lb_"):
        token = args[0][3:]
        u = update.effective_user
        try:
            r = requests.post(
                f"{SITE}/api/auth/callback",
                headers={"X-Bot-Secret": SECRET, "content-type": "application/json"},
                json={
                    "token": token,
                    "telegram_id": u.id,
                    "first_name":  u.first_name,
                    "last_name":   u.last_name,
                    "username":    u.username,
                },
                timeout=10,
            )
            if r.status_code == 200:
                await update.message.reply_text("✅ Zalogowano w przeglądarce. Wracaj do strony.")
            else:
                await update.message.reply_text("⚠️ Link wygasł. Spróbuj jeszcze raz na stronie.")
        except Exception:
            await update.message.reply_text("⚠️ Błąd połączenia ze stroną. Spróbuj ponownie.")
        return

    # zwykły /start (oryginalna logika bota tu)
    await update.message.reply_text("Cześć! Komendy: /dzisiaj …")
```

> **Niczego nie usuwamy z bota.** Dodajemy tylko gałąź `if args[0].startswith("lb_")`
> w handlerze `/start`. Reszta zachowania bez zmian.

## Bezpieczeństwo

- Token jest **jednorazowy** i ważny **5 minut** (Redis TTL).
- Sekret `BOT_CALLBACK_SECRET` musi być **identyczny** po obu stronach.
  Strona porównuje go stałoczasowo i odrzuca z `401`.
- Token bota Telegram nigdy nie trafia do przeglądarki ani na stronę.
