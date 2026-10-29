# Setting up CRM Tool on your machine

You need two outside accounts: **Google Cloud** (for "Continue with Google") and **Neon** (the database, needed from slice 4). Both are free at this size. Menu names below match the consoles as of October 2026 and may move a little over time.

Your keys go in `.env.local` in the project folder. That file is ignored by git, so it never leaves your machine. `AUTH_SECRET` is already filled in there.

## 1. Google sign-in (needed now)

1. Open https://console.cloud.google.com and sign in with the Google account you'll use for the CRM.
2. Create a project: project picker at the top → **New project** → name it `CRM Tool` → **Create**, then select it.
3. Set up the sign-in screen: menu → **Google Auth Platform** (older consoles: *APIs & Services → OAuth consent screen*) → **Get started**.
   - App name: `CRM Tool`. User support email: your address.
   - Audience: **External**.
   - Contact email: your address. Accept the policy → **Create**.
4. Allow your account: **Audience** → under *Test users* → **Add users** → your Gmail address → **Save**.
   Leaving the app in *Testing* is fine: it only asks Google for your name and email.
5. Create the keys: **Clients** (older: *Credentials → Create credentials → OAuth client ID*) → **Create client**.
   - Application type: **Web application**. Name: `CRM Tool local`.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - **Create**. Copy the **Client ID** and **Client secret** now; the secret is only shown in full once.
6. Open `.env.local` in the project folder and fill in:
   ```
   AUTH_GOOGLE_ID="the client ID"
   AUTH_GOOGLE_SECRET="the client secret"
   ALLOWED_EMAIL="the Gmail address you added as a test user"
   ```
7. Start the app and sign in:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 → **Continue with Google**. Any other Google account is turned away.

When the app goes live on Vercel (slice 9), you'll add the live address as a second origin and redirect URI in the same client.

## 2. Neon database (needed from slice 4)

1. Sign up at https://neon.tech (signing in with Google is fine).
2. **Create project**: name `crm-tool`, Postgres version as offered, and the region closest to you (Vercel will be put in the same region later).
3. On the project dashboard → **Connect** → keep the *Pooled connection* option → copy the connection string (starts with `postgresql://`).
4. Paste it into `.env.local`:
   ```
   DATABASE_URL="postgresql://…"
   ```
5. Create the tables:
   ```bash
   npm run db:migrate
   ```

## If something goes wrong

| What you see | What to do |
|---|---|
| "Google sign-in isn't set up yet" | `AUTH_GOOGLE_ID` or `AUTH_GOOGLE_SECRET` is empty or mistyped in `.env.local`. Restart `npm run dev` after editing. |
| "That account can't open this CRM" | The Google account isn't the one in `ALLOWED_EMAIL`, or `ALLOWED_EMAIL` is empty. |
| Google says `redirect_uri_mismatch` | The redirect URI in the Google client must be exactly `http://localhost:3000/api/auth/callback/google`. |
| Google says "Access blocked: app has not completed verification" | Add your Gmail under **Audience → Test users**. |
| `DATABASE_URL is not set` | Step 2.4 above, then restart the dev server. |
