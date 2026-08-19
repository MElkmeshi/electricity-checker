import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { Telegraf } from "telegraf";
import { createApi } from "./api/server.js";
import { loadConfig } from "./config.js";
import { ElectricityRepository } from "./db/repository.js";
import { formatStatus, formatTransition } from "./messages.js";
import { ElectricityMonitor } from "./monitor.js";
import { startApplication } from "./start-application.js";
import { UispClient } from "./uisp-client.js";

const config = loadConfig(process.env);
const databasePath = resolve(config.databasePath);
mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
const repository = new ElectricityRepository(drizzle(sqlite));
repository.initialize();

const telegram = config.telegram;
const bot = telegram ? new Telegraf(telegram.botToken) : undefined;
const client = new UispClient(
  config.uispApiUrl,
  config.uispDeviceId,
  config.uispAuthToken,
);
const monitor = new ElectricityMonitor(
  client,
  repository,
  async (isOn, observedAt) => {
    if (!bot || !telegram) return;
    await bot.telegram.sendMessage(
      telegram.chatId,
      formatTransition(isOn, observedAt),
    );
  },
);

if (bot && telegram) {
  const isAuthorized = (chatId: number | undefined): boolean =>
    chatId !== undefined && String(chatId) === telegram.chatId;

  bot.start(async (context) => {
    if (!isAuthorized(context.chat?.id)) return;
    await context.reply(
      "Electricity checker is running. Send /status for the live status.",
    );
  });

  bot.command("status", async (context) => {
    if (!isAuthorized(context.chat?.id)) return;
    try {
      const status = await monitor.getStatus();
      await context.reply(formatStatus(status.isOn, status.checkedAt));
    } catch (error) {
      console.error("Status command failed:", error);
      await context.reply("⚠️ Could not check electricity status right now.");
    }
  });

  bot.catch((error) => {
    console.error("Telegram bot error:", error);
  });
} else {
  console.log("No Telegram credentials configured; running dashboard only.");
}

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../web/dist");
const webServer = createApi({ repository, monitor, webRoot }).listen(
  config.webPort,
  () => {
    console.log(`Web dashboard listening on http://localhost:${config.webPort}`);
  },
);

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; shutting down.`);
  monitor.stop();
  bot?.stop(signal);
  webServer.close();
  sqlite.close();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

console.log(
  bot
    ? "Starting Telegram bot and electricity monitor."
    : "Starting electricity monitor.",
);
await startApplication(bot, monitor, config.pollIntervalMs, (error) => {
  console.error("Electricity check failed:", error);
});
