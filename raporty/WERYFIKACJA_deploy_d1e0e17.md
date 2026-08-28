# Weryfikacja: czy commit z PODLACZENIE_odds_form_scorers.md jest wdrożony

**Pytanie:** czy najnowszy commit z sesji (fix odds/form-flags/season_not_seeded)
faktycznie trafił na preview, czy branch ma commit, a build jest starszy.

## Stan brancha (git log)

```
$ git fetch origin claude/determined-galileo-1Vsu7
$ git log -1 --format='%H %ci %s'
d1e0e170494b9e01c33f52f0274e17803b056021 2026-08-22 07:34:01 +0000 \
  Podłącz front do odds/form-flags/season_not_seeded (zweryfikowane curlem)

$ git log -1 --format='%H %ci %s' origin/claude/determined-galileo-1Vsu7
d1e0e170494b9e01c33f52f0274e17803b056021 2026-08-22 07:34:01 +0000 \
  Podłącz front do odds/form-flags/season_not_seeded (zweryfikowane curlem)

$ git status -sb
## claude/determined-galileo-1Vsu7...origin/claude/determined-galileo-1Vsu7
```

Lokalny `HEAD` i `origin/claude/determined-galileo-1Vsu7` są identyczne —
`d1e0e17...` (żaden commit "do przodu" ani "w tyle"). To jest ten sam
commit, który zawiera fixy z `PODLACZENIE_odds_form_scorers.md`.

## Stan builda (Vercel, przez webhook na PR #70)

Ten sandbox nie ma bezpośredniego dostępu do dashboardu Vercel ani do
`*.vercel.app` (egress zablokowany polityką sesji — ten sam limit co przy
wcześniejszych próbach curlowania preview w tej sesji), więc nie mogę
odpytać API Vercela wprost. Mam za to coś równie rozstrzygającego:
**webhooki od samego bota Vercela**, dostarczone na PR #70 automatycznie po
pushu tego commita:

| Zdarzenie | Zawartość |
|---|---|
| `issue_comment.edited` (Building) | `nextCommitStatus: "PENDING"`, deployment `12Katt5ruUzaQEzVyKEiMTWkxAM6` |
| `check_suite.completed` | `app: "vercel"`, `conclusion: "success"`, **`head_sha: "d1e0e170494b9e01c33f52f0274e17803b056021"`** |
| `issue_comment.edited` (Ready) | `nextCommitStatus: "DEPLOYED"`, status **Ready**, ten sam deployment `12Katt5ruUzaQEzVyKEiMTWkxAM6`, ten sam preview URL |

`head_sha` w evencie `check_suite.completed` zgadza się **znak w znak** z
`git log -1` powyżej. Vercel policzył ten build **dla dokładnie tego
commita**, nie dla wcześniejszego — build zakończył się sukcesem i deployment
`12Katt5ruUzaQEzVyKEiMTWkxAM6` przeszedł w status Ready.

## Wniosek

**Branch i build są zsynchronizowane.** Nie ma rozjazdu — Vercel zrobił
nowy build po ostatnim pushu i wdrożył dokładnie commit `d1e0e17`
(fixy odds/form-flags/season_not_seeded). Gdyby to była przyczyna problemu
(np. gdybyś na preview nadal widział stare zachowanie), źródło leży gdzie
indziej — kandydaci do sprawdzenia:

- **cache przeglądarki/CDN** — spróbuj hard-refresh (Ctrl+Shift+R) albo
  otwórz w oknie prywatnym,
- **inny URL niż myślisz** — ten branch ma jeden stały alias
  `nova-pulse-git-claude-determined-gali-78b1a7-mtkittles-projects.vercel.app`
  (widoczny w każdym z powyższych webhooków); upewnij się, że nie patrzysz
  na deployment z innego PR/brancha albo na produkcyjny URL,
  `nova-pulse-sage.vercel.app`,
- **cache danych po stronie Next.js/Oracle** (`oracleFetch` ma
  `revalidate: 300`, czyli do 5 min) — jeśli curlowałeś tuż po deployu,
  część odpowiedzi mogła jeszcze pochodzić ze starszego cache'a ISR.

Sam deploy jednak — potwierdzone — jest aktualny.

## Zakres

Wyłącznie weryfikacja stanu brancha/builda — **żaden plik kodu nie został
zmieniony**.
