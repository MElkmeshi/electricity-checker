import { integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const electricityEvents = sqliteTable("electricity_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  isOn: integer("is_on", { mode: "boolean" }).notNull(),
  observedAt: integer("observed_at", { mode: "timestamp_ms" }).notNull(),
});
