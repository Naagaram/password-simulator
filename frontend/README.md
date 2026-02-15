# Password Simulator Frontend

React + Vite app for interactive password strength and breach analysis.

## Setup

```bash
npm install
npm run dev
```

Development server runs on Vite defaults and proxies `/analyze` and `/health` to the backend.

## Environment

Copy `.env.example` to `.env` if you want to target a custom backend origin:

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL`: optional backend origin (for example `https://api.example.com`).

If unset, the frontend sends requests to same-origin `/analyze`.

## Scripts

- `npm run dev`: start local dev server
- `npm run build`: production build
- `npm run lint`: ESLint checks
- `npm run test`: node-based unit tests for frontend utilities

## UX/Security Notes

- Password generation uses `crypto.getRandomValues`.
- Analyzer calls include timeout + retry behavior.
- Breach descriptions render as plain text (no raw HTML injection).
- Modal includes focus trap and keyboard escape handling.
