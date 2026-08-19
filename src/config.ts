import { z } from "zod";

const environmentSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().regex(/^-?\d+$/),
  UISP_API_URL: z.url().default("https://uisp.hajat.com.ly/nms/api/v2.1"),
  UISP_DEVICE_ID: z.string().min(1),
  UISP_AUTH_TOKEN: z.string().min(1),
  DATABASE_PATH: z.string().min(1).default("./data/electricity.db"),
  POLL_INTERVAL_MS: z.coerce.number().int().min(1_000).default(60_000),
  WEB_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
});

export interface AppConfig {
  telegramBotToken: string;
  telegramChatId: string;
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
    telegramBotToken: values.TELEGRAM_BOT_TOKEN,
    telegramChatId: values.TELEGRAM_CHAT_ID,
    uispApiUrl: values.UISP_API_URL,
    uispDeviceId: values.UISP_DEVICE_ID,
    uispAuthToken: values.UISP_AUTH_TOKEN,
    databasePath: values.DATABASE_PATH,
    pollIntervalMs: values.POLL_INTERVAL_MS,
    webPort: values.WEB_PORT,
  };
}
