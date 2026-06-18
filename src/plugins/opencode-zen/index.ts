import type { Plugin } from "@/plugins/types";
import { ZenSettings } from "./components/zen-settings";
import { ZenClient } from "./zen-client";
import { requirePluginAccess } from "@/plugins";

const client = new ZenClient();

export const opencodeZenPlugin: Plugin = {
  id: "opencode-zen",
  name: "OpenCode Zen",
  description: "AI gateway with 40+ models via OpenCode Zen",
  version: "0.1.0",
  settingsComponent: ZenSettings,
  apiRoutes: {
    "POST /api/plugins/opencode-zen/chat": async (req: Request) => {
      try {
        const { noteContent, messages, workspaceId } = await req.json();
        const access = await requirePluginAccess(req, workspaceId, "opencode-zen");
        if (access instanceof Response) return access;

        const apiKey = access.config?.apiKey;
        if (!apiKey) return Response.json({ error: "API key not configured" }, { status: 400 });

        let systemPrompt = access.config?.systemPrompt || "You are a helpful assistant.";
        if (noteContent) {
          systemPrompt = `${systemPrompt}\n\nHere is the current note content for reference:\n\`\`\`markdown\n${noteContent}\n\`\`\``;
        }

        const result = await client.chat({
          apiKey,
          model: access.config?.model || "deepseek-v4-pro",
          systemPrompt,
          messages: messages || [{ role: "user", content: noteContent || "Help me with this note." }],
        });

        return Response.json(result);
      } catch (e: any) {
        return Response.json({ error: e.message || "Chat failed" }, { status: 500 });
      }
    },

    "GET /api/plugins/opencode-zen/models": async (req: Request) => {
      try {
        const auth = await import("@/lib/auth");
        const session = await auth.auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const models = await client.getModels();
        return Response.json({ models });
      } catch {
        return Response.json({ models: client.getFallbackModels() });
      }
    },
  },
};
