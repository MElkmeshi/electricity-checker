export interface ElectricityClient {
  getElectricityStatus(): Promise<boolean>;
}

export interface ObservationStore {
  latest(): { isOn: boolean; observedAt: Date } | undefined;
  record(isOn: boolean, observedAt: Date): void;
}

export interface LiveStatus {
  isOn: boolean;
  checkedAt: Date;
}

type Notifier = (isOn: boolean, observedAt: Date) => Promise<void> | void;

export class ElectricityMonitor {
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    private readonly client: ElectricityClient,
    private readonly repository: ObservationStore,
    private readonly notify: Notifier,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async check(): Promise<LiveStatus> {
    const isOn = await this.client.getElectricityStatus();
    const checkedAt = this.clock();
    const previous = this.repository.latest();

    if (!previous || previous.isOn !== isOn) {
      this.repository.record(isOn, checkedAt);
      if (previous) {
        await this.notify(isOn, checkedAt);
      }
    }

    return { isOn, checkedAt };
  }

  async getStatus(): Promise<LiveStatus> {
    const isOn = await this.client.getElectricityStatus();
    return { isOn, checkedAt: this.clock() };
  }

  start(intervalMs: number, onError: (error: unknown) => void): void {
    this.stopped = false;
    const run = async () => {
      try {
        await this.check();
      } catch (error) {
        onError(error);
      } finally {
        if (!this.stopped) {
          this.timer = setTimeout(run, intervalMs);
        }
      }
    };
    void run();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }
}
