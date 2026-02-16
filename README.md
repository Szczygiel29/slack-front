# Slackmate

Slackmate is a stateless Slack assistant for translation, summaries, and reply drafting. It processes Slack payloads on-the-fly and does not store message content in a database.

## Shipped features
- Translate Slack messages with AWS Amazon Translate.
- Apply Custom Terminology (glossary) to keep company and product terms consistent.
- Thread TL;DR summaries.
- Incremental summary updates from incoming message payloads (no DB storage).
- Reply suggestions (3 variants) with tone options: FORMAL, CASUAL, SUPPORT, SALES.

## How it works
Slack message/thread payload → AWS Translate → optional summaries or reply suggestions (LLM) → response posted back to Slack. Processing is stateless and message content is not stored in a database.

## Pricing (USD, per user / month)

| Plan | Price | Best for | Included |
| --- | --- | --- | --- |
| Individual | $12 | Personal or small-team usage | Translation, Custom Terminology, thread TL;DR summaries, reply suggestions (3 tones) |
| Business | $24 | Teams with higher usage needs | Everything in Individual, higher usage limits, Business Q&A (add-on) |

Limits depend on usage and model configuration.

### Business Q&A (add-on)
Business Q&A helps answer policy, product, and process questions using organization-provided context at request time. It does not require persistent storage of message content.

## API (endpointy faktycznie używane przez frontend)

Poniżej jest lista endpointów wywoływanych w kodzie frontendu (`src/app`, `src/components`, `src/lib`).

### Bazowe URL-e
- `NEXT_PUBLIC_BACKEND_URL` (domyślnie: `http://localhost:8080/api/v1`) jest używany przez `buildBackendUrl(...)`.
- `NEXT_PUBLIC_BACKEND_URL` (domyślnie: `http://localhost:8080`) jest używany przez `fetchJSON(...)` / `buildApiUrl(...)`.

### Endpointy auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Endpointy użytkownika/admina
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me` (zapis ustawień admina)
- `PUT /api/v1/users/me` (zmiana hasła)
- `GET /api/v1/translate/languages`

### Endpointy ofert i płatności
- `GET /api/v1/offers`
- `POST /api/v1/stripe/setup-intent`
- `POST /api/v1/stripe/subscriptions`

### Szybka mapa: ekran -> endpointy
- `/auth` -> `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `/admin` -> `GET /api/v1/users/me`, `PUT /api/v1/users/me`, `GET /api/v1/translate/languages`
- `/offers` -> `GET /api/v1/offers`, `POST /api/v1/stripe/setup-intent`, `POST /api/v1/stripe/subscriptions`
- `/pricing` -> `POST /api/v1/stripe/setup-intent`, `POST /api/v1/stripe/subscriptions`

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stripe subscriptions (frontend)

1. Skopiuj `.env.local.example` do `.env.local` i uzupełnij wartości:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_BACKEND_URL`
   - `NEXT_PUBLIC_SLACK_CLIENT_ID`
   - `NEXT_PUBLIC_SLACK_REDIRECT_URI`
2. Po każdej zmianie `.env.local` zrestartuj dev server (`npm run dev`), bo wartości `NEXT_PUBLIC_*` są wstrzykiwane podczas startu builda.
3. Uruchom projekt i przejdź do `/pricing`, aby przetestować Stripe Elements + SetupIntent.

```bash
cp .env.local.example .env.local
npm install
npm run dev
```
