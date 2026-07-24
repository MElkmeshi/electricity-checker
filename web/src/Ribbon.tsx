import type { TimelineSegment } from "./api.js";
import { formatClock, formatDuration } from "./format.js";

const DAY_MS = 24 * 60 * 60 * 1000;

interface RibbonProps {
  segments: TimelineSegment[];
  now: number;
}

/** A single proportional strip covering the last 24 hours, oldest on the left. */
export function Ribbon({ segments, now }: RibbonProps) {
  const windowStart = now - DAY_MS;

  const slices = segments
    .map((segment) => {
      const start = Math.max(new Date(segment.startedAt).getTime(), windowStart);
      const end = Math.min(
        segment.endedAt ? new Date(segment.endedAt).getTime() : now,
        now,
      );
      return { segment, start, span: end - start };
    })
    .filter((slice) => slice.span > 0)
    .reverse();

  const covered = slices.reduce((sum, slice) => sum + slice.span, 0);

  return (
    <section className="ribbon" aria-label="Last 24 hours">
      <header className="ribbon__head">
        <h2>Last 24 hours</h2>
        <span className="ribbon__scale">
          {covered > 0 ? `${formatDuration(covered)} recorded` : "no data"}
        </span>
      </header>

      <div className="ribbon__track">
        {covered === 0 ? (
          <div className="ribbon__empty" />
        ) : (
          slices.map((slice) => (
            <div
              key={slice.segment.startedAt}
              className={`ribbon__slice ribbon__slice--${slice.segment.isOn ? "on" : "off"}`}
              style={{ flexGrow: slice.span }}
              title={`${slice.segment.isOn ? "ON" : "OFF"} from ${formatClock(
                slice.segment.startedAt,
              )} · ${formatDuration(slice.span)}`}
            />
          ))
        )}
      </div>

      <div className="ribbon__axis">
        <span>24h ago · {formatClock(new Date(windowStart).toISOString())}</span>
        <span>now</span>
      </div>
    </section>
  );
}
