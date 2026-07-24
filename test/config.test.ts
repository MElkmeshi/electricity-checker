import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

const validEnv = {
  TELEGRAM_BOT_TOKEN: "123:abc",
  TELEGRAM_CHAT_ID: "456",
  ALKAFAA_USERNAME: "account-user",
  ALKAFAA_PASSWORD: "account-password",
};

describe("loadConfig", () => {
  it("loads required values and defaults", () => {
    expect(loadConfig(validEnv)).toEqual({
      telegramBotToken: "123:abc",
      telegramChatId: "456",
      alkafaaApiUrl: "http://my.alkafaa.net/user/api/index.php/api/service",
      alkafaaLoginUrl:
        "http://my.alkafaa.net/user/api/index.php/api/auth/login",
      alkafaaUsername: "account-user",
      alkafaaPassword: "account-password",
      databasePath: "./data/electricity.db",
      pollIntervalMs: 60_000,
      webPort: 3000,
    });
  });

  it("rejects missing Telegram configuration", () => {
    expect(() => loadConfig({})).toThrow(/TELEGRAM_BOT_TOKEN/);
  });

  it("rejects missing Alkafaa credentials", () => {
    expect(() =>
      loadConfig({
        TELEGRAM_BOT_TOKEN: "123:abc",
        TELEGRAM_CHAT_ID: "456",
      }),
    ).toThrow(/ALKAFAA_USERNAME/);
  });

  it("rejects a polling interval below one second", () => {
    expect(() =>
      loadConfig({ ...validEnv, POLL_INTERVAL_MS: "999" }),
    ).toThrow(/POLL_INTERVAL_MS/);
  });
});
