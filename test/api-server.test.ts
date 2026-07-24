import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApi } from "../src/api/server.js";
import { ElectricityRepository } from "../src/db/repository.js";

const at = (hour: number) => new Date(`2026-07-24T${String(hour).padStart(2, "0")}:00:00.000Z`);

function seed() {
  const sqlite = new Database(":memory:");
  const repository = new ElectricityRepository(drizzle(sqlite));
  repository.initialize();
  repository.record(true, at(8));
  repository.record(false, at(10));
  repository.record(true, at(11));
  return { sqlite, repository };
}

describe("GET /api/overview", () => {
  it("returns the live status, stats and newest-first timeline", async () => {
    const { sqlite, repository } = seed();
    const app = createApi({
      repository,
      monitor: { getStatus: async () => ({ isOn: true, checkedAt: at(12) }) },
      clock: () => at(12),
    });

    const response = await request(app).get("/api/overview").expect(200);

    expect(response.body.status).toEqual({
      isOn: true,
      since: at(11).toISOString(),
      forMs: 3_600_000,
      checkedAt: at(12).toISOString(),
      live: true,
    });
    expect(response.body.stats.day.outageCount).toBe(1);
    expect(response.body.timeline).toHaveLength(3);
    expect(response.body.timeline[0]).toEqual({
      isOn: true,
      startedAt: at(11).toISOString(),
      endedAt: null,
      durationMs: 3_600_000,
      ongoing: true,
    });
    sqlite.close();
  });

  it("falls back to the stored state when the live probe fails", async () => {
    const { sqlite, repository } = seed();
    const app = createApi({
      repository,
      monitor: {
        getStatus: async () => {
          throw new Error("upstream down");
        },
      },
      clock: () => at(12),
    });

    const response = await request(app).get("/api/overview").expect(200);

    expect(response.body.status.isOn).toBe(true);
    expect(response.body.status.live).toBe(false);
    sqlite.close();
  });

  it("reports a null status when nothing has been recorded", async () => {
    const sqlite = new Database(":memory:");
    const repository = new ElectricityRepository(drizzle(sqlite));
    repository.initialize();
    const app = createApi({ repository, clock: () => at(12) });

    const response = await request(app).get("/api/overview").expect(200);

    expect(response.body.status.isOn).toBeNull();
    expect(response.body.timeline).toEqual([]);
    expect(response.body.stats.week.uptimeRatio).toBeNull();
    sqlite.close();
  });
});
