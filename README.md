# Scan & Dine

QR-code restaurant ordering. Customers scan a table QR code and order - no accounts. Restaurants manage their menu, tables, team and orders.

## Roles

| Role | How it is created | Can do |
| --- | --- | --- |
| **Superadmin** | Seeded once from `SUPERADMIN_*` in `.env` | Platform analytics, manage restaurants (plan, suspend), pricing plans, monthly invoicing and platform settings; create admins |
| **Admin** | Restaurant signup (first admin) or created by another admin / the superadmin | Menu, tables + QR codes, team (staff and more admins), analytics, staff queries |
| **Staff** | Created by an admin only | Live order board, order status, send queries to admins |
| **Customer** | Nobody - opens `/menu?r=<restaurantId>&table=table-N` from the QR code | Browse the menu, order, follow order status |

Every record belongs to a restaurant (`restaurantId`) and each request is scoped to the caller's restaurant.

## Rules

- Login takes a **username or email in one field** - anything with an `@` is treated as an email.
- Usernames: 3-30 characters, letters, numbers, `_` and `.` only. Unique.
- Passwords: 8+ characters, one capital letter, one special character.
- Forgot password emails a 30-minute, single-use link (`/reset-password?token=...`).

## Setup

```bash
cp .env.example .env            # fill in values
npm install && npm start        # API on :5000
cd frontend && cp .env.example .env && npm install && npm start   # app on :3000
```

- API docs (Swagger): `http://localhost:5000/api` - all endpoints live under `/api/v1`.
- Without `SMTP_HOST`, reset links are printed in the server log instead of emailed.
- List endpoints are paginated: `?page=1&limit=10` -> `{ data, pagination }`.

## Tests

```bash
npm test                                   # backend (Jest + Supertest) - needs a local MongoDB
cd frontend && CI=true npm test            # frontend unit tests
```

Backend tests wipe the database named by `MONGO_URI_TEST` (default `scanndine-test`); a name without "test" is refused.

## Frontend conventions

- **Theme**: colours are CSS variables in `frontend/src/index.css`, exposed as Tailwind tokens (`primary`, `accent`, `canvas`, `ink`, ...) in `tailwind.config.js`. Fonts: Plus Jakarta Sans (headings) and Inter (body). Never hardcode a colour or font in a component.
- **Text**: user-facing copy lives in `src/constants/text.js`.
- **Structure**: data/logic in `src/hooks`, presentational pieces in `src/components`, shared building blocks in `src/components/ui`.
- Components stay under ~300 lines; routes are lazy-loaded; buttons show a loader and disable while a request runs.
