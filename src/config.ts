import { z } from "zod";

const environmentSchema = z
  .object({
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    TELEGRAM_CHAT_ID: z
      .string()
      .regex(/^-?\d+$/)
      .optional(),
    UISP_API_URL: z.url().default("https://uisp.hajat.com.ly/nms/api/v2.1"),
    UISP_DEVICE_ID: z.string().min(1),
    UISP_AUTH_TOKEN: z.string().min(1),
    DATABASE_PATH: z.string().min(1).default("./data/electricity.db"),
    POLL_INTERVAL_MS: z.coerce.number().int().min(1_000).default(60_000),
    WEB_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  })
  .refine(
    (values) =>
      Boolean(values.TELEGRAM_BOT_TOKEN) === Boolean(values.TELEGRAM_CHAT_ID),
    {
      message:
        "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set together, or both left unset to run without Telegram",
      path: ["TELEGRAM_BOT_TOKEN"],
    },
  );

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface AppConfig {
  /** Undefined when the instance runs dashboard-only, with no Telegram bot. */
  telegram?: TelegramConfig;
  uispApiUrl: string;
  uispDeviceId: string;
  uispAuthToken: string;
  databasePath: string;
  pollIntervalMs: number;
  webPort: number;
}

export function loadConfig(
  environment: Record<string, string | undefined>,
): AppConfig {
  const values = environmentSchema.parse(environment);
  return {
    telegram:
      values.TELEGRAM_BOT_TOKEN && values.TELEGRAM_CHAT_ID
        ? {
            botToken: values.TELEGRAM_BOT_TOKEN,
            chatId: values.TELEGRAM_CHAT_ID,
          }
        : undefined,
    uispApiUrl: values.UISP_API_URL,
    uispDeviceId: values.UISP_DEVICE_ID,
    uispAuthToken: values.UISP_AUTH_TOKEN,
    databasePath: values.DATABASE_PATH,
    pollIntervalMs: values.POLL_INTERVAL_MS,
    webPort: values.WEB_PORT,
  };
}
