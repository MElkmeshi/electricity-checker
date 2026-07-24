# Electricity Telegram Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested Telegraf bot that monitors and records Alkafaa electricity status.

**Architecture:** Separate configuration, API access, persistence, monitoring logic, and Telegram delivery into focused TypeScript modules. Inject side-effecting dependencies into the monitor so state behavior can be tested without real network or Telegram calls.

**Tech Stack:** Node.js, TypeScript, Telegraf, Drizzle ORM, better-sqlite3, Vitest

---

### Task 1: Project and configuration

**Files:** `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`, `src/config.ts`, `test/config.test.ts`

- [ ] Write tests asserting required environment variables and defaults.
- [ ] Run the configuration test and verify it fails because `src/config.ts` is absent.
- [ ] Implement typed environment validation and project configuration.
- [ ] Run the test and verify it passes.

### Task 2: Persistence

**Files:** `src/db/schema.ts`, `src/db/repository.ts`, `test/repository.test.ts`

- [ ] Write integration tests for empty history, inserts, and latest-state lookup.
- [ ] Run the repository test and verify it fails because the repository is absent.
- [ ] Implement the Drizzle schema, table creation, and repository.
- [ ] Run the test and verify it passes.

### Task 3: Alkafaa API client

**Files:** `src/alkafaa-client.ts`, `test/alkafaa-client.test.ts`

- [ ] Write tests for valid true/false responses, HTTP failures, and malformed payloads.
- [ ] Run the API client test and verify it fails because the client is absent.
- [ ] Implement the client using injected `fetch`.
- [ ] Run the test and verify it passes.

### Task 4: Monitor behavior

**Files:** `src/monitor.ts`, `test/monitor.test.ts`

- [ ] Write tests for baseline storage, unchanged state, changed state notification, and readable status.
- [ ] Run the monitor test and verify it fails because the monitor is absent.
- [ ] Implement the monitor with non-overlapping polling and isolated error handling.
- [ ] Run the test and verify it passes.

### Task 5: Bot assembly and documentation

**Files:** `src/messages.ts`, `src/index.ts`, `README.md`, `test/messages.test.ts`

- [ ] Write tests for user-facing status and transition messages.
- [ ] Run the message test and verify it fails because the formatter is absent.
- [ ] Implement the formatters, Telegraf commands, dependency assembly, shutdown, and README.
- [ ] Run all tests, type-check, and build.

## Self-review

Every design requirement maps to a task. Module names and interfaces are consistent, and there are no deferred implementation placeholders.
