import type { Plugin } from "@/plugins/types";
import { OpenCodeSettings } from "./components/ai-settings";
import { OpenCodeClient } from "./opencode-client";
import { requirePluginAccess } from "@/plugins";
import { NextResponse } from "next/server";

const client = new OpenCodeClient();

export const opencodeAiPlugin: Plugin = {
  id: "opencode-ai",
  name: "OpenCode Go",
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
        if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 400 });

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

        return NextResponse.json(result);
      } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : String(e) || "Chat failed" }, { status: 500 });
      }
    },

    "GET /api/plugins/opencode-ai/models": async (req: Request) => {
      try {
        const auth = await import("@/lib/auth");
        const session = await auth.auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const models = await client.getModels();
        return NextResponse.json({ models });
      } catch {
        return NextResponse.json({ models: client.getFallbackModels() });
      }
    },
  },
};
