import { auth } from "@/lib/auth";
import { validateApiToken } from "@/lib/api-token-auth";

export async function getAuthUser(request: Request): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
} | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user) {
    return { id: session.user.id, name: session.user.name, email: session.user.email, role: (session.user as any).role || "user" };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const userId = await validateApiToken(token);
    if (userId) {
      return { id: userId, name: "API Token", email: "", role: "user" };
    }
  }

  return null;
}
