import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

const validEnv = {
  TELEGRAM_BOT_TOKEN: "123:abc",
  TELEGRAM_CHAT_ID: "456",
  UISP_DEVICE_ID: "device-uuid",
  UISP_AUTH_TOKEN: "auth-token",
};

describe("loadConfig", () => {
  it("loads required values and defaults", () => {
    expect(loadConfig(validEnv)).toEqual({
      telegramBotToken: "123:abc",
      telegramChatId: "456",
      uispApiUrl: "https://uisp.hajat.com.ly/nms/api/v2.1",
      uispDeviceId: "device-uuid",
      uispAuthToken: "auth-token",
      databasePath: "./data/electricity.db",
      pollIntervalMs: 60_000,
      webPort: 3000,
    });
  });

  it("rejects missing Telegram configuration", () => {
    expect(() => loadConfig({})).toThrow(/TELEGRAM_BOT_TOKEN/);
  });

  it("rejects missing UISP credentials", () => {
    expect(() =>
      loadConfig({
        TELEGRAM_BOT_TOKEN: "123:abc",
        TELEGRAM_CHAT_ID: "456",
      }),
    ).toThrow(/UISP_DEVICE_ID/);
  });

  it("rejects a polling interval below one second", () => {
    expect(() =>
      loadConfig({ ...validEnv, POLL_INTERVAL_MS: "999" }),
    ).toThrow(/POLL_INTERVAL_MS/);
  });
});
