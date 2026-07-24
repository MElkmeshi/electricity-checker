import { z } from "zod";

const environmentSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().regex(/^-?\d+$/),
  ALKAFAA_API_URL: z
    .url()
    .default("http://my.alkafaa.net/user/api/index.php/api/service"),
  ALKAFAA_LOGIN_URL: z
    .url()
    .default("http://my.alkafaa.net/user/api/index.php/api/auth/login"),
  ALKAFAA_USERNAME: z.string().min(1),
  ALKAFAA_PASSWORD: z.string().min(1),
  DATABASE_PATH: z.string().min(1).default("./data/electricity.db"),
  POLL_INTERVAL_MS: z.coerce.number().int().min(1_000).default(60_000),
  WEB_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
});

export interface AppConfig {
  telegramBotToken: string;
  telegramChatId: string;
  alkafaaApiUrl: string;
  alkafaaLoginUrl: string;
  alkafaaUsername: string;
  alkafaaPassword: string;
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
    alkafaaApiUrl: values.ALKAFAA_API_URL,
    alkafaaLoginUrl: values.ALKAFAA_LOGIN_URL,
    alkafaaUsername: values.ALKAFAA_USERNAME,
    alkafaaPassword: values.ALKAFAA_PASSWORD,
    databasePath: values.DATABASE_PATH,
    pollIntervalMs: values.POLL_INTERVAL_MS,
    webPort: values.WEB_PORT,
  };
}
