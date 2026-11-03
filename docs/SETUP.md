# Setting up Dialwise on your machine

You need two outside accounts: **Google Cloud** (for "Continue with Google") and **Neon** (the database). Both are free at this size. Menu names below match the consoles as of October 2026 and may move a little over time.

Your keys go in `.env.local` in the project folder. That file is ignored by git, so it never leaves your machine. `AUTH_SECRET` is already filled in there. Paste keys straight into the file, not into a chat.

## 1. Google sign-in

1. Open https://console.cloud.google.com and sign in with the Google account you'll use for the CRM.
2. Create a project: project picker at the top → **New project** → name it `Dialwise` → **Create**, then select it.
3. Set up the sign-in screen: menu → **Google Auth Platform** (older consoles: *APIs & Services → OAuth consent screen*) → **Get started**.
   - App name: `Dialwise`. User support email: your address.
   - Audience: **External**.
   - Contact email: your address. Accept the policy → **Create**.
4. Allow your account: **Audience** → under *Test users* → **Add users** → your Gmail address → **Save**.
   Leaving the app in *Testing* is fine: it only asks Google for your name and email.
5. Create the keys: **Clients** (older: *Credentials → Create credentials → OAuth client ID*) → **Create client**.
   - Application type: **Web application**. Name: `Dialwise local`.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - **Create**. Copy the **Client ID** and **Client secret** now; the secret is only shown in full once.
6. Open `.env.local` in the project folder and fill in:
   ```
   AUTH_GOOGLE_ID="the client ID"
   AUTH_GOOGLE_SECRET="the client secret"
   ALLOWED_EMAIL="the Gmail address you added as a test user"
   ```

   To let someone else in (they sign in with their own Google account, so you never share yours), add their Gmail to the list and to **Audience → Test users** in Google:

   ```
   ALLOWED_EMAIL="you@gmail.com, friend@gmail.com"
   ```

   Everyone on the list sees and can change the same leads, lists and calls: it is one shared CRM.

When the app goes live on Vercel (slice 9), you'll add the live address as a second origin and redirect URI in the same client.

## 2. Neon database

1. Sign up at https://neon.tech (signing in with Google is fine).
2. **Create project**: name `crm-tool`, Postgres version as offered, and the region closest to you (Vercel will be put in the same region later).
3. On the project dashboard → **Connect** → keep the *Pooled connection* option → copy the connection string (starts with `postgresql://`, ends with something like `?sslmode=require&channel_binding=require`). Keep the whole string.
4. Paste it into `.env.local`:
   ```
   DATABASE_URL="postgresql://…"
   ```
5. Create the tables (this also adds the default settings: call hours 09:00–18:00 Monday to Friday, 24-hour retry gap, UK as the default country):
   ```bash
   npm run db:migrate
   ```

## 3. Start the app and sign in

```bash
npm run dev
```

Open http://localhost:3000 → **Continue with Google** → pick the account from `ALLOWED_EMAIL`. Any other Google account is turned away. Restart `npm run dev` whenever you change `.env.local`.

## If something goes wrong

| What you see | What to do |
|---|---|
| "Google sign-in isn't set up yet" | `AUTH_GOOGLE_ID` or `AUTH_GOOGLE_SECRET` is empty or mistyped in `.env.local`. Restart `npm run dev` after editing. |
| "That account can't open this CRM" | The Google account isn't on the `ALLOWED_EMAIL` list, or the list is empty. |
| Google says `redirect_uri_mismatch` | The redirect URI in the Google client must be exactly `http://localhost:3000/api/auth/callback/google`. |
| Google says "Access blocked: app has not completed verification" | Add your Gmail under **Audience → Test users**. |
| `DATABASE_URL is not set` | Step 2.4 above, then restart the dev server. |
| `password authentication failed` or `getaddrinfo ENOTFOUND` | The connection string is incomplete or mistyped. Copy it again from Neon's **Connect** dialog, including the part after `?`. |
| A "SECURITY WARNING: The SSL modes 'prefer', 'require' … are treated as aliases for 'verify-full'" message | Harmless. The database driver checks Neon's certificate fully, which is stricter than the connection string asks for. |
| `relation "leads" does not exist` | The tables aren't there yet: run `npm run db:migrate`. |
