import { describe, expect, it } from "vitest";
import { formatStatus, formatTransition } from "../src/messages.js";

describe("messages", () => {
  const at = new Date("2026-07-24T12:00:00.000Z");

  it("formats live status", () => {
    expect(formatStatus(true, at)).toBe(
      "🟢 Electricity is ON.\nChecked: 2:00 PM",
    );
    expect(formatStatus(false, at)).toBe(
      "🔴 Electricity is OFF.\nChecked: 2:00 PM",
    );
  });

  it("formats transitions", () => {
    expect(formatTransition(true, at)).toBe(
      "🟢 Electricity switched ON.\nDetected: 2:00 PM",
    );
    expect(formatTransition(false, at)).toBe(
      "🔴 Electricity switched OFF.\nDetected: 2:00 PM",
    );
  });

  it("formats daylight time in the Africa/Tripoli timezone", () => {
    const summer = new Date("2026-07-24T06:03:00.000Z");

    expect(formatStatus(true, summer)).toContain("Checked: 8:03 AM");
  });
});
