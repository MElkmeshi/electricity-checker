export interface ElectricityEvent {
  isOn: boolean;
  observedAt: Date;
}

export interface TimelineSegment {
  isOn: boolean;
  startedAt: Date;
  /** `null` while the segment is still running. */
  endedAt: Date | null;
  durationMs: number;
  ongoing: boolean;
}

export interface TimelineStats {
  uptimeRatio: number | null;
  outageCount: number;
  longestOutageMs: number | null;
  averageOutageMs: number | null;
  coveredMs: number;
}

/**
 * Turns the recorded transitions into closed periods. Every event opens a
 * segment that the next event closes; the final one runs until `now`.
 */
export function buildTimeline(
  events: ElectricityEvent[],
  now: Date,
): TimelineSegment[] {
  return events.map((event, index) => {
    const next = events[index + 1];
    const endedAt = next ? next.observedAt : null;
    const stop = endedAt ?? now;
    return {
      isOn: event.isOn,
      startedAt: event.observedAt,
      endedAt,
      durationMs: Math.max(0, stop.getTime() - event.observedAt.getTime()),
      ongoing: endedAt === null,
    };
  });
}

/**
 * Aggregates the segments that overlap the window `[now - windowMs, now]`,
 * clipping partial segments so the ratio always covers the same span.
 */
export function summarize(
  segments: TimelineSegment[],
  now: Date,
  windowMs: number,
): TimelineStats {
  const windowStart = now.getTime() - windowMs;
  let onMs = 0;
  let coveredMs = 0;
  const outages: number[] = [];

  for (const segment of segments) {
    const start = Math.max(segment.startedAt.getTime(), windowStart);
    const end = Math.min((segment.endedAt ?? now).getTime(), now.getTime());
    const overlap = end - start;
    if (overlap <= 0) continue;

    coveredMs += overlap;
    if (segment.isOn) {
      onMs += overlap;
    } else {
      outages.push(overlap);
    }
  }

  const totalOutageMs = outages.reduce((sum, value) => sum + value, 0);
  return {
    uptimeRatio: coveredMs > 0 ? onMs / coveredMs : null,
    outageCount: outages.length,
    longestOutageMs: outages.length > 0 ? Math.max(...outages) : null,
    averageOutageMs: outages.length > 0 ? totalOutageMs / outages.length : null,
    coveredMs,
  };
}
