# Deep-link logowanie (Telegram) — instrukcja dla bota

Strona generuje token (UUID), otwiera `https://t.me/<bot>?start=lb_<TOKEN>`.
Bot dostaje `/start lb_<TOKEN>`, wyciąga token, dzwoni do strony z danymi
użytkownika. Strona ustawia sesję, a przeglądarka się przeloguje (polling).

Magazyn tokenów: **Upstash Redis** (współdzielony między instancjami Vercela).

## Co bot musi zrobić (handler `/start`)

Po komendzie `/start <param>`:

1. Jeśli `param` zaczyna się od `lb_` → `token = param[3:]`.
2. POST do strony:
   - URL: `${PUBLIC_SITE_URL}/api/auth/callback`
   - nagłówek: `X-Bot-Secret: ${BOT_CALLBACK_SECRET}`
   - body JSON: `{ "token", "telegram_id", "first_name", "last_name", "username" }`
3. Odpowiedz na czacie: 200 → „✅ Zalogowano", 401/410 → „Link wygasł".

## Zmienne

**Oracle (`.env` bota):**
- `PUBLIC_SITE_URL` — np. `https://nova-pulse.vercel.app`
- `BOT_CALLBACK_SECRET` — ten sam napis co na Vercel.

**Vercel (Settings → Environment Variables, Production + Preview):**
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Upstash → Create Redis → REST)
- `BOT_CALLBACK_SECRET` (`openssl rand -base64 32`)
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — nazwa bota bez `@`

## Szkic (python-telegram-bot)

```python
import os, requests
from telegram import Update
from telegram.ext import ContextTypes

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
                json={"token": token, "telegram_id": u.id,
                      "first_name": u.first_name, "last_name": u.last_name,
                      "username": u.username},
                timeout=10,
            )
            await update.message.reply_text(
                "✅ Zalogowano w przeglądarce. Wracaj do strony."
                if r.status_code == 200 else "⚠️ Link wygasł. Spróbuj ponownie na stronie.")
        except Exception:
            await update.message.reply_text("⚠️ Błąd połączenia ze stroną.")
        return
    # ... istniejąca logika /start poniżej, bez zmian
```

> **Niczego nie usuwamy z bota** — dodajemy tylko gałąź `if args[0].startswith("lb_")`.

## Bezpieczeństwo
- Token jednorazowy, TTL 5 min (Redis).
- `BOT_CALLBACK_SECRET` identyczny po obu stronach; strona odrzuca z `401`.
- Token bota Telegram nie trafia do przeglądarki ani na stronę.
