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
      telegram: { botToken: "123:abc", chatId: "456" },
      uispApiUrl: "https://uisp.hajat.com.ly/nms/api/v2.1",
      uispDeviceId: "device-uuid",
      uispAuthToken: "auth-token",
      databasePath: "./data/electricity.db",
      pollIntervalMs: 60_000,
      webPort: 3000,
    });
  });

  it("omits Telegram when neither credential is set", () => {
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ...withoutTelegram } =
      validEnv;
    expect(loadConfig(withoutTelegram).telegram).toBeUndefined();
  });

  it.each([
    ["TELEGRAM_CHAT_ID", { ...validEnv, TELEGRAM_CHAT_ID: undefined }],
    ["TELEGRAM_BOT_TOKEN", { ...validEnv, TELEGRAM_BOT_TOKEN: undefined }],
  ])("rejects Telegram configuration missing %s", (_label, environment) => {
    expect(() => loadConfig(environment)).toThrow(/set together/);
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
