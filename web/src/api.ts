export interface TimelineSegment {
  isOn: boolean;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
  ongoing: boolean;
}

export interface WindowStats {
  uptimeRatio: number | null;
  outageCount: number;
  longestOutageMs: number | null;
  averageOutageMs: number | null;
  coveredMs: number;
}

export interface Overview {
  status: {
    isOn: boolean | null;
    since: string | null;
    forMs: number | null;
    checkedAt: string;
    live: boolean;
  };
  stats: { day: WindowStats; week: WindowStats };
  timeline: TimelineSegment[];
  generatedAt: string;
}

export async function fetchOverview(signal?: AbortSignal): Promise<Overview> {
  const response = await fetch("/api/overview", { signal });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as Overview;
}
