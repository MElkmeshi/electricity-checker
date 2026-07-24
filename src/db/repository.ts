import { count, desc, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { electricityEvents } from "./schema.js";

export interface ElectricityObservation {
  isOn: boolean;
  observedAt: Date;
}

export class ElectricityRepository {
  constructor(private readonly database: BetterSQLite3Database) {}

  initialize(): void {
    this.database.run(sql.raw(`
      CREATE TABLE IF NOT EXISTS electricity_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        is_on INTEGER NOT NULL,
        observed_at INTEGER NOT NULL
      )
    `));
  }

  latest(): ElectricityObservation | undefined {
    return this.database
      .select({
        isOn: electricityEvents.isOn,
        observedAt: electricityEvents.observedAt,
      })
      .from(electricityEvents)
      .orderBy(desc(electricityEvents.id))
      .limit(1)
      .get();
  }

  record(isOn: boolean, observedAt: Date): void {
    this.database.insert(electricityEvents).values({ isOn, observedAt }).run();
  }

  count(): number {
    return (
      this.database.select({ value: count() }).from(electricityEvents).get()
        ?.value ?? 0
    );
  }
}
