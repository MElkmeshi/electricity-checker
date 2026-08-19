import { describe, expect, it, vi } from "vitest";
import { UispClient } from "../src/uisp-client.js";

const deviceUrl =
  "https://uisp.test/nms/api/v2.1/devices/device-uuid";

function deviceResponse(overview: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ overview }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function createClient(fetcher: typeof fetch): UispClient {
  return new UispClient(
    "https://uisp.test/nms/api/v2.1",
    "device-uuid",
    "auth-token",
    fetcher,
  );
}

describe("UispClient", () => {
  it("treats an active device as electricity on", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        deviceResponse({
          status: "active",
          lastSeen: "2026-08-19T23:32:51.209Z",
          uptime: 1307,
        }),
      );

    await expect(createClient(fetcher).getElectricityStatus()).resolves.toBe(
      true,
    );
    expect(fetcher).toHaveBeenCalledWith(deviceUrl, {
      headers: {
        accept: "application/json",
        "x-auth-token": "auth-token",
      },
      signal: expect.any(AbortSignal),
    });
  });

  it.each(["disconnected", "unauthorized", "inactive"])(
    "treats status=%s as electricity off",
    async (status) => {
      const client = createClient(
        vi.fn().mockResolvedValue(deviceResponse({ status })),
      );
      await expect(client.getElectricityStatus()).resolves.toBe(false);
    },
  );

  it("trims a trailing slash from the API URL", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(deviceResponse({ status: "active" }));
    const client = new UispClient(
      "https://uisp.test/nms/api/v2.1/",
      "device-uuid",
      "auth-token",
      fetcher,
    );

    await client.getElectricityStatus();
    expect(fetcher).toHaveBeenCalledWith(deviceUrl, expect.anything());
  });

  it("exposes lastSeen and uptime from the overview", async () => {
    const client = createClient(
      vi.fn().mockResolvedValue(
        deviceResponse({
          status: "active",
          lastSeen: "2026-08-19T23:32:51.209Z",
          uptime: 1307,
        }),
      ),
    );

    await expect(client.getDeviceOverview()).resolves.toEqual({
      status: "active",
      lastSeen: new Date("2026-08-19T23:32:51.209Z"),
      uptimeSeconds: 1307,
    });
  });

  it("omits lastSeen and uptime when the device never reported them", async () => {
    const client = createClient(
      vi
        .fn()
        .mockResolvedValue(
          deviceResponse({ status: "active", lastSeen: null, uptime: null }),
        ),
    );

    await expect(client.getDeviceOverview()).resolves.toEqual({
      status: "active",
      lastSeen: undefined,
      uptimeSeconds: undefined,
    });
  });

  it("rejects HTTP failures", async () => {
    const client = createClient(
      vi.fn().mockResolvedValue(new Response("nope", { status: 403 })),
    );
    await expect(client.getElectricityStatus()).rejects.toThrow(/HTTP 403/);
  });

  it("rejects payloads without overview.status", async () => {
    const client = createClient(
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ overview: { uptime: 1307 } })),
        ),
    );
    await expect(client.getElectricityStatus()).rejects.toThrow(
      /overview.status/,
    );
  });
});
