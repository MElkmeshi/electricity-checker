import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { Telegraf } from "telegraf";
import { AlkafaaClient } from "./alkafaa-client.js";
import { loadConfig } from "./config.js";
import { ElectricityRepository } from "./db/repository.js";
import { formatStatus, formatTransition } from "./messages.js";
import { ElectricityMonitor } from "./monitor.js";
import { startApplication } from "./start-application.js";

const config = loadConfig(process.env);
const databasePath = resolve(config.databasePath);
mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
const repository = new ElectricityRepository(drizzle(sqlite));
repository.initialize();

const bot = new Telegraf(config.telegramBotToken);
const client = new AlkafaaClient(
  config.alkafaaApiUrl,
  config.alkafaaLoginUrl,
  config.alkafaaUsername,
  config.alkafaaPassword,
);
const monitor = new ElectricityMonitor(
  client,
  repository,
  async (isOn, observedAt) => {
    await bot.telegram.sendMessage(
      config.telegramChatId,
      formatTransition(isOn, observedAt),
    );
  },
);

function isAuthorized(chatId: number | undefined): boolean {
  return chatId !== undefined && String(chatId) === config.telegramChatId;
}

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

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; shutting down.`);
  monitor.stop();
  bot.stop(signal);
  sqlite.close();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

console.log("Starting Telegram bot and electricity monitor.");
await startApplication(bot, monitor, config.pollIntervalMs, (error) => {
  console.error("Electricity check failed:", error);
});
