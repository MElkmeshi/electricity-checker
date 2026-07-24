import { randomUUID } from "node:crypto";
import CryptoJS from "crypto-js";
import { z } from "zod";

const encryptionPassphrase = "abcdefghijuklmno0123456789012345";

const responseSchema = z.object({
  data: z.object({
    status: z.boolean(),
  }),
});

const autoLoginSchema = z.object({
  token: z.string().min(1),
});

export class AlkafaaClient {
  private token?: string;

  constructor(
    private readonly serviceUrl: string,
    private readonly loginUrl: string,
    private readonly username: string,
    private readonly password: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly createSessionId: () => string = randomUUID,
  ) {}

  async getElectricityStatus(): Promise<boolean> {
    let response = await this.fetchService(await this.getToken());

    if (response.status === 401 || response.status === 403) {
      this.token = undefined;
      response = await this.fetchService(await this.getToken());
    }

    if (!response.ok) {
      throw new Error(`Alkafaa API returned HTTP ${response.status}`);
    }

    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error("Alkafaa response is missing boolean data.status");
    }
    return parsed.data.data.status;
  }

  private async getToken(): Promise<string> {
    if (this.token) return this.token;

    const credentials = {
      username: this.username,
      password: this.password,
      language: "en",
      captcha_text: null,
      session_id: this.createSessionId(),
    };
    const payload = CryptoJS.AES.encrypt(
      JSON.stringify(credentials),
      encryptionPassphrase,
    ).toString();

    const response = await this.fetcher(this.loginUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: "Bearer null",
      },
      body: JSON.stringify({ payload }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Alkafaa login returned HTTP ${response.status}`);
    }

    const parsed = autoLoginSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error("Alkafaa login response is missing token");
    }
    this.token = parsed.data.token;
    return this.token;
  }

  private fetchService(token: string): Promise<Response> {
    return this.fetcher(this.serviceUrl, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(15_000),
    });
  }
}
