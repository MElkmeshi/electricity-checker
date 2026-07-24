const TIME_ZONE = "Africa/Tripoli";

const clockFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "2-digit",
  month: "short",
});

export function formatClock(iso: string): string {
  return clockFormatter.format(new Date(iso));
}

export function formatDay(iso: string): string {
  return dayFormatter.format(new Date(iso));
}

/** `2h 41m`, `9m`, `48s` — the coarsest two units that carry signal. */
export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return `${Math.max(0, Math.floor(ms / 1000))}s`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 1) return `${minutes}m`;

  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
}

export function formatPercent(ratio: number | null): string {
  if (ratio === null) return "—";
  return `${(ratio * 100).toFixed(1)}%`;
}
