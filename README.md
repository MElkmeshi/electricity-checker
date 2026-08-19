# Electricity Checker Telegram Bot

This bot checks the UISP device `overview.status` every minute:

- `active` means electricity is **ON**
- anything else (`disconnected`, `unauthorized`, …) means electricity is **OFF**

The device sits at the monitored site, so it only answers UISP while it has
power.

It saves the first observed state and every later transition to SQLite. It sends a Telegram notification only when the state changes. The `/status` command performs a fresh API check.

It also serves a one-page React dashboard (`web/`) on `WEB_PORT` showing the current status, a 24-hour ribbon, uptime stats and the full transition timeline. The page refreshes itself every 30 seconds through React Query.

## Requirements

- Node.js 20 or newer
- A Telegram bot token from BotFather
- Your numeric Telegram chat ID
- A UISP API token and the device UUID you want to watch

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```dotenv
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-numeric-chat-id
UISP_API_URL=https://uisp.hajat.com.ly/nms/api/v2.1
UISP_DEVICE_ID=your-device-uuid
UISP_AUTH_TOKEN=your-uisp-api-token
DATABASE_PATH=./data/electricity.db
POLL_INTERVAL_MS=60000
WEB_PORT=3000
```

The UISP token is sent as the `x-auth-token` header on `GET
{UISP_API_URL}/devices/{UISP_DEVICE_ID}`. Create it in UISP under Settings →
Users → API tokens. Keep `.env` private.

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

- `src/` — Telegram bot, UISP client, SQLite repository
- `src/timeline.ts` — turns transitions into segments and uptime stats
- `src/api/server.ts` — Express API plus static hosting for the dashboard
- `web/` — Vite + React + React Query single-page dashboard
