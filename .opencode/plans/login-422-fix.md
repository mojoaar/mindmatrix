# Fix: Login 422 — Direct fetch bypassing Better Auth client

## Problem
Better Auth server returns valid token + user with HTTP 422 when email is unverified.
`authClient.signIn.email()` treats any non-200 status as error, blocking the redirect.

## Fix
1 file: `src/app/(auth)/login/page.tsx`
- Replace `authClient.signIn.email()` with direct `fetch("/api/auth/sign-in/email", ...)`
- Check `data.token` in response body (present even at 422) to determine login success
- Remove `authClient` import, not needed

```diff
- const res = await authClient.signIn.email({ email, password });
- if (res.error) { ... }
+ const res = await fetch("/api/auth/sign-in/email", {
+   method: "POST",
+   headers: { "Content-Type": "application/json" },
+   body: JSON.stringify({ email, password }),
+ });
+ const data = await res.json();
+ if (data.token) { router.push("/dashboard"); return; }
```

## Why previous fixes failed
Every previous fix kept using `authClient.signIn.email()` which internally checks HTTP status.
Direct fetch gives full control — we check `data.token` regardless of status code.

## No other files affected
Register page is fine (fresh signups don't hit 422).
Verify-totp page uses direct fetch (already fixed).
MFA settings page uses direct fetch (already fixed).