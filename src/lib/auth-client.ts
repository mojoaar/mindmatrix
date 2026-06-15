import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/plugins";

const baseURL = process.env.NEXT_PUBLIC_APP_URL;
if (!baseURL) {
  throw new Error(
    "NEXT_PUBLIC_APP_URL is required. Set it in your environment or .env file."
  );
}

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    twoFactorClient({
      twoFactorPage: "/verify-totp",
    }),
  ],
});
