export interface LaunchableBot {
  launch(): Promise<void>;
}

export interface StartableMonitor {
  start(intervalMs: number, onError: (error: unknown) => void): void;
}

export async function startApplication(
  bot: LaunchableBot,
  monitor: StartableMonitor,
  intervalMs: number,
  onMonitorError: (error: unknown) => void,
): Promise<void> {
  monitor.start(intervalMs, onMonitorError);
  await bot.launch();
}
