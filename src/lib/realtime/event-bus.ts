import { sql } from "@/lib/db";

type EventHandler = (payload: unknown) => void;

class EventBus {
  private channels = new Map<string, Set<EventHandler>>();

  subscribe(channel: string, handler: EventHandler): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
      sql.listen(channel, (payload: string) => {
        const handlers = this.channels.get(channel);
        if (handlers) {
          let parsed: unknown;
          try { parsed = JSON.parse(payload); } catch { parsed = payload; }
          handlers.forEach((h) => h(parsed));
        }
      }).catch(() => {});
    }
    this.channels.get(channel)!.add(handler);

    return () => {
      const handlers = this.channels.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.channels.delete(channel);
        }
      }
    };
  }

  async notify(channel: string, payload: unknown) {
    try {
      await sql`SELECT pg_notify(${channel}, ${JSON.stringify(payload)})`;
    } catch {
      // notify may fail if DB is unavailable — ignore
    }
  }
}

const globalForEventBus = globalThis as unknown as {
  bus: EventBus | undefined;
};

export function getEventBus(): EventBus {
  if (!globalForEventBus.bus) {
    globalForEventBus.bus = new EventBus();
  }
  return globalForEventBus.bus;
}
