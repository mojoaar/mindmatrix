import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { logAction } from "@/lib/audit";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is required. Set it in your environment or .env file.");
}
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is required. Set it in your environment or .env file.");
}

const globalForAuth = globalThis as unknown as {
  auth: any;
};

export const auth =
  globalForAuth.auth ??
  betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Reset your MindMatrix password",
          html: `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour.</p>`,
        });
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const existing = await db.query.user.findFirst();
            if (!existing) {
              return {
                data: {
                  ...user,
                  role: "super_admin",
                },
              };
            }
          },
          after: async (user) => {
            await logAction(user.id, "USER_REGISTER", `User ${user.email} registered`, undefined);
          },
        },
      },
      session: {
        create: {
          after: async (session) => {
            await logAction(session.userId, "USER_LOGIN", session.ipAddress ? `IP: ${session.ipAddress}` : "Login", undefined);
          },
        },
      },
    },
    plugins: [
      twoFactor({
        issuer: "MindMatrix",
        totpDigits: 6,
        totpPeriod: 30,
        numberOfBackupCodes: 10,
      }),
    ],
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuth.auth = auth;
}
