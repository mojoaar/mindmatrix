import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db";
import { sendVerificationEmail, sendResetPasswordEmail } from "@/lib/email";
import { logAction } from "@/lib/audit";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is required. Set it in your environment or .env file.");
}
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is required. Set it in your environment or .env file.");
}

const authInstance = betterAuth({
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
      image: {
        type: "string",
        required: false,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "browser",
      },
      timeFormat: {
        type: "string",
        required: false,
        defaultValue: "browser",
      },
      twoFactorEnabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      theme: {
        type: "string",
        required: false,
        defaultValue: "nord-dark",
      },
      font: {
        type: "string",
        required: false,
        defaultValue: "jetbrains-mono",
      },
      sidebarFolders: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      sidebarTags: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      editorLayout: {
        type: "string",
        required: false,
        defaultValue: "split",
      },
      dateFormat: {
        type: "string",
        required: false,
        defaultValue: "browser",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ name: user.name, email: user.email }, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ name: user.name, email: user.email }, url);
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
      delete: {
        after: async (session) => {
          await logAction(session.userId, "USER_LOGOUT", "User signed out", undefined);
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

export const auth = authInstance;
