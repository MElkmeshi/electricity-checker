import { z } from "zod";

const deviceSchema = z.object({
  overview: z.object({
    status: z.string(),
    lastSeen: z.string().nullable().optional(),
    uptime: z.number().nullable().optional(),
  }),
});

export interface DeviceOverview {
  status: string;
  lastSeen?: Date;
  uptimeSeconds?: number;
}

export class UispClient {
  constructor(
    private readonly apiUrl: string,
    private readonly deviceId: string,
    private readonly authToken: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async getElectricityStatus(): Promise<boolean> {
    const overview = await this.getDeviceOverview();
    return overview.status === "active";
  }

  async getDeviceOverview(): Promise<DeviceOverview> {
    const response = await this.fetcher(
      `${this.apiUrl.replace(/\/$/, "")}/devices/${this.deviceId}`,
      {
        headers: {
          accept: "application/json",
          "x-auth-token": this.authToken,
        },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      throw new Error(`UISP API returned HTTP ${response.status}`);
    }

    const parsed = deviceSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error("UISP response is missing overview.status");
    }

    const { status, lastSeen, uptime } = parsed.data.overview;
    return {
      status,
      lastSeen: lastSeen ? new Date(lastSeen) : undefined,
      uptimeSeconds: uptime ?? undefined,
    };
  }
}
