import { describe, expect, it, vi } from "vitest";
import CryptoJS from "crypto-js";
import { AlkafaaClient } from "../src/alkafaa-client.js";

const encryptionPassphrase = "abcdefghijuklmno0123456789012345";

describe("AlkafaaClient", () => {
  it.each([true, false])("returns data.status=%s", async (status) => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 200, token: "fresh-token" })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 200, data: { status } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const client = new AlkafaaClient(
      "http://example.test/service",
      "http://example.test/login",
      "account-user",
      "account-password",
      fetcher,
      () => "fixed-session-id",
    );

    await expect(client.getElectricityStatus()).resolves.toBe(status);
    expect(fetcher).toHaveBeenNthCalledWith(1, "http://example.test/login", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: "Bearer null",
      },
      body: expect.any(String),
      signal: expect.any(AbortSignal),
    });
    const loginBody = JSON.parse(
      String(fetcher.mock.calls[0]?.[1]?.body),
    ) as { payload: string };
    const decrypted = CryptoJS.AES.decrypt(
      loginBody.payload,
      encryptionPassphrase,
    ).toString(CryptoJS.enc.Utf8);
    expect(JSON.parse(decrypted)).toEqual({
      username: "account-user",
      password: "account-password",
      language: "en",
      captcha_text: null,
      session_id: "fixed-session-id",
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, "http://example.test/service", {
      headers: {
        accept: "application/json",
        authorization: "Bearer fresh-token",
      },
      signal: expect.any(AbortSignal),
    });
  });

  it("rejects HTTP failures", async () => {
    const client = new AlkafaaClient(
      "http://example.test/service",
      "http://example.test/login",
      "account-user",
      "account-password",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ status: 200, token: "token" })),
        )
        .mockResolvedValueOnce(new Response("bad", { status: 500 })),
    );
    await expect(client.getElectricityStatus()).rejects.toThrow(/HTTP 500/);
  });

  it("rejects payloads without a boolean data.status", async () => {
    const client = new AlkafaaClient(
      "http://example.test/service",
      "http://example.test/login",
      "account-user",
      "account-password",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ status: 200, token: "token" })),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: { status: "yes" } })),
        ),
    );
    await expect(client.getElectricityStatus()).rejects.toThrow(/data.status/);
  });

  it("refreshes the token and retries once after an unauthorized response", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 200, token: "old-token" })),
      )
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 200, token: "new-token" })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { status: true } })),
      );
    const client = new AlkafaaClient(
      "http://example.test/service",
      "http://example.test/login",
      "account-user",
      "account-password",
      fetcher,
    );

    await expect(client.getElectricityStatus()).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(fetcher.mock.calls[3]?.[1]).toMatchObject({
      headers: { authorization: "Bearer new-token" },
    });
  });

  it("rejects a login response without a token", async () => {
    const client = new AlkafaaClient(
      "http://example.test/service",
      "http://example.test/login",
      "account-user",
      "account-password",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 200 }))),
    );
    await expect(client.getElectricityStatus()).rejects.toThrow(/token/);
  });
});
