import { existsSync } from "node:fs";
import express, { type Express } from "express";
import type { ElectricityObservation } from "../db/repository.js";
import { buildTimeline, summarize } from "../timeline.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface HistoryStore {
  history(limit?: number): ElectricityObservation[];
  latest(): ElectricityObservation | undefined;
}

export interface StatusProbe {
  getStatus(): Promise<{ isOn: boolean; checkedAt: Date }>;
}

export interface ApiOptions {
  repository: HistoryStore;
  /** Optional live probe; the API falls back to the stored state when it fails. */
  monitor?: StatusProbe;
  /** Directory holding the built React app. Skipped when it does not exist. */
  webRoot?: string;
  historyLimit?: number;
  clock?: () => Date;
}

export function createApi({
  repository,
  monitor,
  webRoot,
  historyLimit = 200,
  clock = () => new Date(),
}: ApiOptions): Express {
  const app = express();

  app.get("/api/overview", async (_request, response) => {
    const now = clock();
    const segments = buildTimeline(repository.history(historyLimit), now);
    const stored = repository.latest();

    let live: { isOn: boolean; checkedAt: Date } | undefined;
    try {
      live = await monitor?.getStatus();
    } catch {
      live = undefined;
    }

    const current = segments.at(-1);
    response.json({
      status: {
        isOn: live?.isOn ?? stored?.isOn ?? null,
        since: current?.startedAt.toISOString() ?? null,
        forMs: current?.durationMs ?? null,
        checkedAt: (live?.checkedAt ?? now).toISOString(),
        live: live !== undefined,
      },
      stats: {
        day: summarize(segments, now, DAY_MS),
        week: summarize(segments, now, 7 * DAY_MS),
      },
      timeline: segments
        .slice()
        .reverse()
        .map((segment) => ({
          isOn: segment.isOn,
          startedAt: segment.startedAt.toISOString(),
          endedAt: segment.endedAt?.toISOString() ?? null,
          durationMs: segment.durationMs,
          ongoing: segment.ongoing,
        })),
      generatedAt: now.toISOString(),
    });
  });

  if (webRoot && existsSync(webRoot)) {
    app.use(express.static(webRoot));
    app.get(/^\/(?!api\/).*/, (_request, response) => {
      response.sendFile("index.html", { root: webRoot });
    });
  }

  return app;
}
