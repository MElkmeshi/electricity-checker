import { useQuery } from "@tanstack/react-query";
import type { Overview, TimelineSegment, WindowStats } from "./api.js";
import { fetchOverview } from "./api.js";
import { formatClock, formatDay, formatDuration, formatPercent } from "./format.js";
import { Ribbon } from "./Ribbon.js";
import { useNow } from "./useNow.js";

export function App() {
  const now = useNow();
  const { data, error, isPending, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["overview"],
    queryFn: ({ signal }) => fetchOverview(signal),
  });

  return (
    <div className="shell">
      <div className="grain" aria-hidden="true" />
      <Masthead isFetching={isFetching} updatedAt={dataUpdatedAt} />

      {isPending && <p className="notice">Reading the meter…</p>}
      {error && (
        <p className="notice notice--bad">
          Cannot reach the monitor. Retrying automatically.
        </p>
      )}
      {data && <Dashboard data={data} now={now} />}

      <footer className="foot">
        <span>Alkafaa feed · polled every minute</span>
        <span>Africa/Tripoli</span>
      </footer>
    </div>
  );
}

function Masthead({
  isFetching,
  updatedAt,
}: {
  isFetching: boolean;
  updatedAt: number;
}) {
  return (
    <header className="masthead">
      <div className="masthead__mark">
        <span className="masthead__bolt" aria-hidden="true">
          ⚡
        </span>
        <div>
          <h1>Grid Watch</h1>
          <p>Household electricity monitor</p>
        </div>
      </div>
      <div className={`pulse ${isFetching ? "pulse--busy" : ""}`}>
        <span className="pulse__dot" aria-hidden="true" />
        {isFetching
          ? "syncing"
          : updatedAt
            ? `synced ${formatClock(new Date(updatedAt).toISOString())}`
            : "idle"}
      </div>
    </header>
  );
}

function Dashboard({ data, now }: { data: Overview; now: number }) {
  const { status, stats, timeline } = data;
  const state = status.isOn === null ? "unknown" : status.isOn ? "on" : "off";
  const liveFor =
    status.since === null ? null : now - new Date(status.since).getTime();

  return (
    <main>
      <section className={`hero hero--${state}`}>
        <p className="hero__label">Right now</p>
        <p className="hero__state">
          {state === "unknown" ? "No reading" : state === "on" ? "Power on" : "Power off"}
        </p>
        <p className="hero__meta">
          {status.since
            ? `Holding for ${formatDuration(liveFor)} · since ${formatClock(status.since)}`
            : "Waiting for the first observation."}
        </p>
        {!status.live && status.isOn !== null && (
          <p className="hero__stale">Live check unavailable — showing last stored state.</p>
        )}
      </section>

      <Ribbon segments={timeline} now={now} />

      <section className="stats">
        <StatColumn title="Last 24 hours" stats={stats.day} />
        <StatColumn title="Last 7 days" stats={stats.week} />
      </section>

      <Timeline segments={timeline} />
    </main>
  );
}

function StatColumn({ title, stats }: { title: string; stats: WindowStats }) {
  return (
    <article className="stats__col">
      <h2>{title}</h2>
      <dl>
        <Stat label="Uptime" value={formatPercent(stats.uptimeRatio)} big />
        <Stat label="Outages" value={String(stats.outageCount)} />
        <Stat label="Longest outage" value={formatDuration(stats.longestOutageMs)} />
        <Stat label="Average outage" value={formatDuration(stats.averageOutageMs)} />
      </dl>
    </article>
  );
}

function Stat({
  label,
  value,
  big = false,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className={`stat ${big ? "stat--big" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Timeline({ segments }: { segments: TimelineSegment[] }) {
  if (segments.length === 0) {
    return (
      <section className="timeline">
        <h2>Timeline</h2>
        <p className="notice">Nothing recorded yet.</p>
      </section>
    );
  }

  let lastDay = "";

  return (
    <section className="timeline">
      <h2>Timeline</h2>
      <ol>
        {segments.map((segment) => {
          const day = formatDay(segment.startedAt);
          const newDay = day !== lastDay;
          lastDay = day;

          return (
            <li
              key={segment.startedAt}
              className={`event event--${segment.isOn ? "on" : "off"}`}
            >
              {newDay && <p className="event__day">{day}</p>}
              <div className="event__row">
                <span className="event__time">{formatClock(segment.startedAt)}</span>
                <span className="event__node" aria-hidden="true" />
                <span className="event__what">
                  {segment.isOn ? "Power restored" : "Power cut"}
                  {segment.ongoing && <em className="event__now">ongoing</em>}
                </span>
                <span className="event__span">{formatDuration(segment.durationMs)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
