import { describe, expect, it } from "vitest";
import { formatStatus, formatTransition } from "../src/messages.js";

describe("messages", () => {
  const at = new Date("2026-07-24T12:00:00.000Z");

  it("formats live status", () => {
    expect(formatStatus(true, at)).toContain("ON");
    expect(formatStatus(false, at)).toContain("OFF");
  });

  it("formats transitions", () => {
    expect(formatTransition(true, at)).toContain("switched ON");
    expect(formatTransition(false, at)).toContain("switched OFF");
  });
});
