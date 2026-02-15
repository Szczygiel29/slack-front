# Endpointy frontend ↔ backend

## Baza URL

Frontend korzysta z dwóch helperów URL:

- `buildBackendUrl(path)` – domyślnie: `http://localhost:8080/api/v1` + ścieżka (np. `/offers` → `http://localhost:8080/api/v1/offers`).
- `buildApiUrl(path)` używane przez `fetchJSON` – domyślnie: `http://localhost:8080` + ścieżka (np. `/api/v1/stripe/setup-intent` → `http://localhost:8080/api/v1/stripe/setup-intent`).

## Endpointy

### 1) POST `/api/v1/auth/register`
- **Skąd wywoływane:** `src/app/auth/page.tsx`
- **Request JSON:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response JSON (używane przez frontend):**
```json
{
  "message": "string"
}
```
Frontend czyta głównie `message` (np. „Activation email sent.”), reszta pól jeśli istnieją nie jest tutaj wymagana.

### 2) POST `/api/v1/auth/login`
- **Skąd wywoływane:** `src/app/auth/page.tsx`
- **Request JSON:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response JSON (używane przez frontend):**
```json
{
  "accessToken": "string",
  "tokenType": "string",
  "message": "string"
}
```
W praktyce frontend używa `accessToken`, opcjonalnie `tokenType`, oraz `message` przy błędach.

### 3) GET `/api/v1/offers`
- **Skąd wywoływane:** `src/app/offers/page.tsx`
- **Request JSON:** brak (GET bez body)
- **Response JSON:** tablica ofert
```json
[
  {
    "type": "INDIVIDUAL | BUSINESS",
    "title": "string",
    "audience": "string",
    "pricePerMonthUsd": 12.0,
    "included": ["string"]
  }
]
```

### 4) GET `/api/v1/users/me`
- **Skąd wywoływane:** `src/app/admin/page.tsx`
- **Request JSON:** brak (GET bez body)
- **Response JSON (model użytkownika admina):**
```json
{
  "id": "string",
  "email": "string",
  "handledEmails": ["string"],
  "defaultLanguage": "string | null",
  "subscriptionStartedAt": "string | null",
  "nextBillingAt": "string | null",
  "currentWorkspaceCount": 0,
  "stripeSubscription": {
    "subscriptionActive": true
  },
  "createdAt": "string | null"
}
```

### 5) PUT `/api/v1/users/me` (aktualizacja ustawień admina)
- **Skąd wywoływane:** `src/app/admin/page.tsx` (`handleSave`)
- **Request JSON:**
```json
{
  "handledEmails": ["string"],
  "defaultLanguage": "string"
}
```
- **Response JSON:** frontend nie wymaga konkretnego obiektu (sprawdza tylko status `response.ok`).

### 6) PUT `/api/v1/users/me` (zmiana hasła)
- **Skąd wywoływane:** `src/app/admin/page.tsx` (`handlePasswordSave`)
- **Request JSON:**
```json
{
  "password": "string"
}
```
- **Response JSON:** frontend nie wymaga konkretnego obiektu (sprawdza tylko status `response.ok`).

### 7) GET `/api/v1/translate/languages`
- **Skąd wywoływane:** `src/app/admin/page.tsx`
- **Request JSON:** brak (GET bez body)
- **Response JSON (akceptowane przez frontend):**

Wspierane formaty odpowiedzi:

1. Tablica stringów:
```json
["pl", "en", "de"]
```
2. Obiekt z `languages`:
```json
{
  "languages": ["pl", "en"]
}
```
3. Obiekt z `items`:
```json
{
  "items": [
    { "code": "pl", "label": "Polish" },
    { "value": "en", "name": "English" }
  ]
}
```
Dla obiektów frontend mapuje pola: `code | value | id | name | label` jako `value`, oraz `label | name | code | value | id` jako `label`.

### 8) POST `/api/v1/stripe/setup-intent`
- **Skąd wywoływane:** `src/app/offers/page.tsx`, `src/app/pricing/PricingClient.tsx`
- **Request JSON:**
```json
{
  "offerType": "INDIVIDUAL | BUSINESS"
}
```
- **Response JSON:**
```json
{
  "clientSecret": "string"
}
```

### 9) POST `/api/v1/stripe/subscriptions`
- **Skąd wywoływane:** `src/components/StripeCheckoutForm.tsx`
- **Request JSON:**
```json
{
  "paymentMethodId": "string",
  "offerType": "INDIVIDUAL | BUSINESS"
}
```
- **Response JSON:**
```json
{
  "stripeCustomerId": "string",
  "stripeSubscriptionId": "string",
  "subscriptionActive": true,
  "emailLimit": 1000
}
```

## Uwierzytelnianie i nagłówki

- Część wywołań wysyła nagłówek `Authorization` poprzez `buildAuthHeaders` (token z `localStorage`).
- `fetchJSON` zawsze wysyła `Content-Type: application/json` i `credentials: include`, a przy błędzie próbuje odczytać `message` z JSON.

### 10) GET `/api/v1/slack/oauth/callback`
- **Skąd wywoływane:** `src/app/api/slack/oauth/callback/route.ts` (proxy endpoint frontendu)
- **Request JSON:** brak (GET z parametrami OAuth z Slacka, np. `code`, `state`)
- **Response JSON:** opcjonalnie `{ "message": "string" }` przy błędzie.

Frontendowy endpoint `/api/slack/oauth/callback` przekazuje query params oraz ciasteczka do backendu, a następnie przekierowuje użytkownika na `/slack/connected` (sukces) lub `/slack/connected?status=error&message=...` (błąd).
