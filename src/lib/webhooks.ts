import { db, webhook, webhookDeliveryLog } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { decrypt } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { isSafeUrl, getSafeResolvedUrl } from "@/lib/security";

export const WEBHOOK_EVENTS = [
  "note.created", "note.updated", "note.deleted",
  "folder.created", "folder.updated", "folder.deleted",
  "tag.created", "tag.updated", "tag.deleted",
] as const;
export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

export interface WebhookOperator {
  id: string;
  name: string;
  email: string;
}

async function dispatchWithRetry(
  url: string,
  headers: Record<string, string>,
  body: string,
  wh: typeof webhook.$inferSelect,
  event: string,
  maxAttempts = 3
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(5000),
      });

      await db.insert(webhookDeliveryLog).values({
        id: crypto.randomUUID(),
        webhookId: wh.id,
        event,
        statusCode: res.status,
        success: res.ok,
        attempt,
      });

      if (res.ok) return;
    } catch (err) {
      await db.insert(webhookDeliveryLog).values({
        id: crypto.randomUUID(),
        webhookId: wh.id,
        event,
        success: false,
        error: String(err),
        attempt,
      });
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}

export async function triggerWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, any>,
  operator?: WebhookOperator | null
) {
  // Execute in background so we don't block main request thread
  (async () => {
    try {
      const activeHooks = await db.query.webhook.findMany({
        where: and(eq(webhook.workspaceId, workspaceId), eq(webhook.active, true)),
      });

      const eligibleHooks = activeHooks.filter((wh) => {
        try {
          const evs = wh.events as string[];
          return Array.isArray(evs) && evs.includes(event);
        } catch {
          return false;
        }
      });

      if (eligibleHooks.length === 0) return;

      const payload = {
        event,
        timestamp: new Date().toISOString(),
        workspaceId,
        operator: operator || null,
        data,
      };

      const body = JSON.stringify(payload);

      await Promise.all(
        eligibleHooks.map(async (wh) => {
          try {
            const resolved = await getSafeResolvedUrl(wh.url);
            if (!resolved) {
              logger.warn("SSRF Prevention: Aborted webhook dispatch", { url: wh.url });
              return;
            }

            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              "User-Agent": "MindMatrix-Webhook-Engine/0.6.0",
              Host: resolved.host,
            };

            if (wh.secret) {
              const decryptedSecret = decrypt(wh.secret);
              if (decryptedSecret) {
                const signature = crypto
                  .createHmac("sha256", decryptedSecret)
                  .update(body)
                  .digest("hex");
                headers["X-MindMatrix-Signature"] = signature;
              }
            }

            await dispatchWithRetry(resolved.url, headers, body, wh, event);
          } catch (err: any) {
            logger.error("Failed to dispatch webhook", { url: wh.url, error: err.message });
          }
        })
      );
    } catch (err) {
      logger.error("triggerWebhooks execution error", { error: err instanceof Error ? err.message : String(err) });
    }
  })();
}
