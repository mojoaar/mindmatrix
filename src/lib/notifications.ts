import { db, notification } from "@/lib/db";
import { getEventBus } from "@/lib/realtime/event-bus";

export async function createNotification(opts: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const [notif] = await db
      .insert(notification)
      .values({
        id: crypto.randomUUID(),
        userId: opts.userId,
        type: opts.type,
        title: opts.title,
        message: opts.message,
        link: opts.link || null,
      })
      .returning();

    const eventBus = getEventBus();
    await eventBus.notify(`user:${opts.userId}`, {
      type: "new_notification",
      notification: notif,
    });

    return notif;
  } catch {
    // Don't let notification failures crash the caller
  }
}
