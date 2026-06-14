import type { Plugin } from "@/plugins/types";
import { OpenCodeSettings } from "./components/ai-settings";
import { OpenCodeClient } from "./opencode-client";

const client = new OpenCodeClient();

export const opencodeAiPlugin: Plugin = {
  id: "opencode-ai",
  name: "OpenCode AI",
  description: "AI-powered note assistance via OpenCode Go",
  version: "0.1.0",
  settingsComponent: OpenCodeSettings,
  apiRoutes: {
    "POST /api/plugins/opencode-ai/chat": async (req: Request) => {
      try {
        const { noteContent, messages, workspaceId } = await req.json();
        const auth = await import("@/lib/auth");
        const db = await import("@/lib/db");
        const session = await auth.auth.api.getSession({ headers: req.headers });
        if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const config = await db.db.query.pluginConfig.findFirst({
          where: (pc, { and, eq }) =>
            and(eq(pc.workspaceId, workspaceId), eq(pc.pluginId, "opencode-ai")),
        });
        if (!config?.enabled) return Response.json({ error: "Plugin not enabled" }, { status: 400 });

        const cfg = config.config as any;
        const apiKey = cfg?.apiKey;
        if (!apiKey) return Response.json({ error: "API key not configured" }, { status: 400 });

        const result = await client.chat({
          apiKey,
          model: cfg?.model || "deepseek-v4-pro",
          systemPrompt: cfg?.systemPrompt || "You are a helpful assistant.",
          messages: messages || [{ role: "user", content: noteContent || "Help me with this note." }],
        });

        return Response.json(result);
      } catch (e: any) {
        return Response.json({ error: e.message || "Chat failed" }, { status: 500 });
      }
    },

    "GET /api/plugins/opencode-ai/models": async () => {
      try {
        const models = await client.getModels();
        return Response.json({ models });
      } catch {
        return Response.json({ models: client.getFallbackModels() });
      }
    },
  },
};
