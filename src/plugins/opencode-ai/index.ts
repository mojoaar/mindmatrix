import type { Plugin } from "@/plugins/types";
import { OpenCodeSettings } from "./components/ai-settings";
import { OpenCodeClient } from "./opencode-client";
import { requirePluginAccess } from "@/plugins";

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
        const access = await requirePluginAccess(req, workspaceId, "opencode-ai");
        if (access instanceof Response) return access;

        const apiKey = access.config?.apiKey;
        if (!apiKey) return Response.json({ error: "API key not configured" }, { status: 400 });

        const result = await client.chat({
          apiKey,
          model: access.config?.model || "deepseek-v4-pro",
          systemPrompt: access.config?.systemPrompt || "You are a helpful assistant.",
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
