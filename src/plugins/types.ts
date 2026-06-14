import type { ComponentType } from "react";

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;

  settingsComponent?: ComponentType<{ workspaceId: string }>;
  noteFooter?: ComponentType<{ noteId: string; content: string; workspaceSlug: string }>;
  apiRoutes?: Record<string, (req: Request) => Promise<Response>>;
}
