import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingClient } from "@/components/landing/landing-client";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");

  const configRows = await db.query.systemConfig.findMany();
  const config: Record<string, string> = {};
  for (const row of configRows) config[row.key] = row.value;

  if (config.showLandingPage === "false") redirect("/login");

  return <LandingClient />;
}