import { describe, expect, it, vi } from "vitest";
import { startApplication } from "../src/start-application.js";

describe("startApplication", () => {
  it("starts electricity monitoring before Telegram long polling blocks", async () => {
    const neverResolves = new Promise<void>(() => {});
    const bot = { launch: vi.fn(() => neverResolves) };
    const monitor = { start: vi.fn() };
    const onError = vi.fn();

    void startApplication(bot, monitor, 60_000, onError);
    await Promise.resolve();

    expect(monitor.start).toHaveBeenCalledWith(60_000, onError);
    expect(bot.launch).toHaveBeenCalled();
  });

  it("starts monitoring and resolves when there is no Telegram bot", async () => {
    const monitor = { start: vi.fn() };
    const onError = vi.fn();

    await expect(
      startApplication(undefined, monitor, 60_000, onError),
    ).resolves.toBeUndefined();
    expect(monitor.start).toHaveBeenCalledWith(60_000, onError);
  });
});
