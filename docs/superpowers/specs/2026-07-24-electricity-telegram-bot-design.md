# Electricity Telegram Bot Design

## Goal

Run a Telegram bot that checks the Alkafaa service once per minute, records electricity state transitions in SQLite, notifies one configured Telegram chat when the state changes, and answers `/status`.

## Architecture

The application uses a small dependency-injected monitor service. An API client reads `data.status` from the configured endpoint. A Drizzle-backed repository stores observations only when the boolean state differs from the last stored state. A Telegraf adapter sends transition messages and serves the `/status` command.

Telegram configuration and Alkafaa credentials come exclusively from environment variables. The API client reproduces the website's CryptoJS AES encryption to generate a fresh login payload, caches the returned bearer token in memory, and logs in again once after an HTTP 401 or 403 response. The first successful poll establishes the baseline and is stored without sending a transition notification.

## Reliability

Polling starts immediately and repeats every 60 seconds without overlapping requests. Network or malformed-response failures are logged and do not create a false state transition. A failed Telegram notification does not discard the already recorded transition. SQLite data persists under the configured database path.

## Testing

Unit tests cover API response parsing, initial observation, unchanged observations, state transitions, failures, and status reporting. Repository integration tests use an in-memory SQLite database. Configuration validation is tested separately.
