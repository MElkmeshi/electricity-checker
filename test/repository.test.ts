import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";
import { ElectricityRepository } from "../src/db/repository.js";

describe("ElectricityRepository", () => {
  it("stores observations and returns the latest one", () => {
    const sqlite = new Database(":memory:");
    const repository = new ElectricityRepository(drizzle(sqlite));
    repository.initialize();

    expect(repository.latest()).toBeUndefined();
    repository.record(true, new Date("2026-07-24T10:00:00.000Z"));
    repository.record(false, new Date("2026-07-24T11:00:00.000Z"));

    expect(repository.latest()).toEqual({
      isOn: false,
      observedAt: new Date("2026-07-24T11:00:00.000Z"),
    });
    expect(repository.count()).toBe(2);
    expect(repository.history()).toEqual([
      { isOn: true, observedAt: new Date("2026-07-24T10:00:00.000Z") },
      { isOn: false, observedAt: new Date("2026-07-24T11:00:00.000Z") },
    ]);
    expect(repository.history(1)).toEqual([
      { isOn: false, observedAt: new Date("2026-07-24T11:00:00.000Z") },
    ]);
    sqlite.close();
  });
});
