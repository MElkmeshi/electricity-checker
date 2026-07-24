import { describe, expect, it, vi } from "vitest";
import { ElectricityMonitor } from "../src/monitor.js";

function setup(initial?: { isOn: boolean; observedAt: Date }) {
  let latest = initial;
  const repository = {
    latest: vi.fn(() => latest),
    record: vi.fn((isOn: boolean, observedAt: Date) => {
      latest = { isOn, observedAt };
    }),
  };
  const client = { getElectricityStatus: vi.fn() };
  const notify = vi.fn();
  const clock = () => new Date("2026-07-24T12:00:00.000Z");
  return {
    monitor: new ElectricityMonitor(client, repository, notify, clock),
    repository,
    client,
    notify,
  };
}

describe("ElectricityMonitor", () => {
  it("records the first observation without notification", async () => {
    const subject = setup();
    subject.client.getElectricityStatus.mockResolvedValue(true);
    await subject.monitor.check();
    expect(subject.repository.record).toHaveBeenCalledWith(
      true,
      new Date("2026-07-24T12:00:00.000Z"),
    );
    expect(subject.notify).not.toHaveBeenCalled();
  });

  it("does not record an unchanged observation", async () => {
    const subject = setup({
      isOn: true,
      observedAt: new Date("2026-07-24T11:00:00.000Z"),
    });
    subject.client.getElectricityStatus.mockResolvedValue(true);
    await subject.monitor.check();
    expect(subject.repository.record).not.toHaveBeenCalled();
  });

  it("records and notifies a changed observation", async () => {
    const subject = setup({
      isOn: true,
      observedAt: new Date("2026-07-24T11:00:00.000Z"),
    });
    subject.client.getElectricityStatus.mockResolvedValue(false);
    await subject.monitor.check();
    expect(subject.repository.record).toHaveBeenCalled();
    expect(subject.notify).toHaveBeenCalledWith(
      false,
      new Date("2026-07-24T12:00:00.000Z"),
    );
  });

  it("reports a fresh live status", async () => {
    const subject = setup();
    subject.client.getElectricityStatus.mockResolvedValue(false);
    await expect(subject.monitor.getStatus()).resolves.toEqual({
      isOn: false,
      checkedAt: new Date("2026-07-24T12:00:00.000Z"),
    });
  });
});
