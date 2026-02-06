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

## API (assist endpoints)

### POST /api/v1/assist/thread-summary
**Request (example)**
```json
{
  "thread": {
    "messages": [
      { "user": "U123", "text": "Can we ship the update today?" },
      { "user": "U456", "text": "QA signed off this morning." }
    ]
  }
}
```

**Response (example)**
```json
{
  "summary": "QA signed off and the team is asking to ship today."
}
```

### POST /api/v1/assist/message-summary-update
**Request (example)**
```json
{
  "summary": "QA signed off and the team is asking to ship today.",
  "message": { "user": "U789", "text": "Release window is 3pm PT." }
}
```

**Response (example)**
```json
{
  "summary": "QA signed off, the team wants to ship today, and the release window is 3pm PT."
}
```

### POST /api/v1/assist/reply-suggestions
**Request (example)**
```json
{
  "message": { "user": "U123", "text": "Can you confirm the rollout plan?" },
  "tone": "FORMAL"
}
```

**Response (example)**
```json
{
  "suggestions": [
    "Yes — the rollout begins today at 3pm PT and will finish by end of day.",
    "Confirmed. We start at 3pm PT and will complete the rollout today.",
    "Confirmed. The rollout is scheduled for 3pm PT today."
  ]
}
```

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stripe subscriptions (frontend)

1. Skopiuj `.env.local.example` do `.env.local` i uzupełnij wartości:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_API_BASE_URL`
2. Uruchom projekt i przejdź do `/pricing`, aby przetestować Stripe Elements + SetupIntent.

```bash
cp .env.local.example .env.local
npm install
npm run dev
```
