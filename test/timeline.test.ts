import { describe, expect, it } from "vitest";
import { buildTimeline, summarize } from "../src/timeline.js";

const HOUR = 60 * 60 * 1000;
const at = (hour: number) => new Date(`2026-07-24T${String(hour).padStart(2, "0")}:00:00.000Z`);

describe("buildTimeline", () => {
  it("closes each segment with the next event and leaves the last one ongoing", () => {
    const segments = buildTimeline(
      [
        { isOn: true, observedAt: at(8) },
        { isOn: false, observedAt: at(10) },
        { isOn: true, observedAt: at(11) },
      ],
      at(12),
    );

    expect(segments).toEqual([
      { isOn: true, startedAt: at(8), endedAt: at(10), durationMs: 2 * HOUR, ongoing: false },
      { isOn: false, startedAt: at(10), endedAt: at(11), durationMs: HOUR, ongoing: false },
      { isOn: true, startedAt: at(11), endedAt: null, durationMs: HOUR, ongoing: true },
    ]);
  });

  it("returns nothing when there are no events", () => {
    expect(buildTimeline([], at(12))).toEqual([]);
  });
});

describe("summarize", () => {
  it("computes uptime and outage stats over the window", () => {
    const segments = buildTimeline(
      [
        { isOn: true, observedAt: at(8) },
        { isOn: false, observedAt: at(10) },
        { isOn: true, observedAt: at(11) },
      ],
      at(12),
    );

    const stats = summarize(segments, at(12), 4 * HOUR);

    expect(stats.coveredMs).toBe(4 * HOUR);
    expect(stats.uptimeRatio).toBe(0.75);
    expect(stats.outageCount).toBe(1);
    expect(stats.longestOutageMs).toBe(HOUR);
    expect(stats.averageOutageMs).toBe(HOUR);
  });

  it("clips segments that started before the window", () => {
    const segments = buildTimeline([{ isOn: false, observedAt: at(0) }], at(12));

    const stats = summarize(segments, at(12), 2 * HOUR);

    expect(stats.coveredMs).toBe(2 * HOUR);
    expect(stats.uptimeRatio).toBe(0);
    expect(stats.longestOutageMs).toBe(2 * HOUR);
  });

  it("reports null ratios when the window holds no data", () => {
    expect(summarize([], at(12), HOUR)).toEqual({
      uptimeRatio: null,
      outageCount: 0,
      longestOutageMs: null,
      averageOutageMs: null,
      coveredMs: 0,
    });
  });
});
