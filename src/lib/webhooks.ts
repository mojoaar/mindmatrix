import { db, webhook } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { decrypt } from "@/lib/crypto";
import { isSafeUrl } from "@/lib/security";

export interface WebhookOperator {
  id: string;
  name: string;
  email: string;
}

export async function triggerWebhooks(
  workspaceId: string,
  event: string,
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
            if (!(await isSafeUrl(wh.url))) {
              console.warn(`SSRF Prevention: Aborted webhook dispatch to internal/private target URL: ${wh.url}`);
              return;
            }

            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              "User-Agent": "MindMatrix-Webhook-Engine/0.2.0",
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

            const response = await fetch(wh.url, {
              method: "POST",
              headers,
              body,
              signal: AbortSignal.timeout(5000), // Timeout after 5 seconds to prevent hanging
            });

            if (!response.ok) {
              console.error(`Webhook target ${wh.url} returned status ${response.status}`);
            }
          } catch (err: any) {
            console.error(`Failed to dispatch webhook to ${wh.url}:`, err.message || err);
          }
        })
      );
    } catch (err) {
      console.error("Error in triggerWebhooks execution:", err);
    }
  })();
}
