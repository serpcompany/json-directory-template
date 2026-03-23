# GitHub Auth In The Starter

- The starter now uses GitHub OAuth through `next-auth` in `apps/web`.
- There is no starter database requirement for this auth flow.
- GitHub owns the credentials. The app only keeps a signed session cookie.
- Required env vars for a working auth flow are `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `NEXTAUTH_SECRET`.
- `apps/web/lib/auth.ts` intentionally returns a safe signed-out state when those env vars are missing so the site still builds and the login page can explain what is missing.
- The first protected destination is `/account`, which redirects signed-out users to `/login?callbackUrl=%2Faccount`.
- If profile data grows beyond what GitHub returns in session, add a small database later for app-owned profile fields instead of storing auth data in JSON.
