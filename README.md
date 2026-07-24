# Electricity Checker Telegram Bot

This bot checks `data.status` from the Alkafaa service every minute:

- `true` means electricity is **ON**
- `false` means electricity is **OFF**

It saves the first observed state and every later transition to SQLite. It sends a Telegram notification only when the state changes. The `/status` command performs a fresh API check.

It also serves a one-page React dashboard (`web/`) on `WEB_PORT` showing the current status, a 24-hour ribbon, uptime stats and the full transition timeline. The page refreshes itself every 30 seconds through React Query.

## Requirements

- Node.js 20 or newer
- A Telegram bot token from BotFather
- Your numeric Telegram chat ID
- Your Alkafaa username and password

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```dotenv
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-numeric-chat-id
ALKAFAA_API_URL=http://my.alkafaa.net/user/api/index.php/api/service
ALKAFAA_LOGIN_URL=http://my.alkafaa.net/user/api/index.php/api/auth/login
ALKAFAA_USERNAME=your-alkafaa-username
ALKAFAA_PASSWORD=your-alkafaa-password
DATABASE_PATH=./data/electricity.db
POLL_INTERVAL_MS=60000
WEB_PORT=3000
```

The bot reproduces the website's CryptoJS AES encryption to create a fresh login payload from the username and password. It keeps the returned token in memory and logs in again if the service responds with HTTP 401 or 403. Keep `.env` private.

## Run

For development, run the bot and the Vite dev server in two terminals:

```bash
npm run dev       # bot + API on WEB_PORT
npm run web:dev   # dashboard on http://localhost:5173, proxying /api
```

For production, `npm run build` compiles the bot and builds the React app into
`web/dist`, which the API process then serves:

```bash
npm run build
npm start
```

The dashboard is then on `http://localhost:3000` and exposes a single
`GET /api/overview` endpoint. It has no authentication, so keep it on your local
network or behind a reverse proxy if you put it online.

Send `/start` or `/status` to the bot from the configured chat. Commands from other chats are ignored.

## Test

```bash
npm test
npm run typecheck
```

## Layout

- `src/` — Telegram bot, Alkafaa client, SQLite repository
- `src/timeline.ts` — turns transitions into segments and uptime stats
- `src/api/server.ts` — Express API plus static hosting for the dashboard
- `web/` — Vite + React + React Query single-page dashboard
