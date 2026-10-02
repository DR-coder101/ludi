# Supabase Setup Guide

This guide explains how to set up Supabase for Ludi's authentication and match history features (M5.1).

## Architecture Overview

Ludi uses a **server-authoritative auth model**:

- The **server** holds the Supabase service role key and performs all database operations
- The **mobile client** calls server HTTP endpoints (`/auth/guest`, `/auth/signup`, etc.)
- The mobile client **does NOT** have a Supabase client or credentials

This architecture ensures:
- Guest users can authenticate without email/password
- Server validates all operations and enforces RLS policies
- No credentials leak to the client
- Sessions persist via cross-platform storage (SecureStore/localStorage)

## Setup Steps

### 1. Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in (or create an account using `dn_rbnsn@protonmail.com`)
3. Click **"New Project"**
4. Choose your organization
5. Set project details:
   - **Name**: `ludi` (or your preference)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

### 2. Enable Anonymous Sign-Ins

Anonymous sign-ins allow guest users to authenticate without email/password.

1. In your Supabase project dashboard, go to **Authentication** → **Providers**
2. Find **"Anonymous sign-ins"** in the provider list
3. Toggle it **ON** (enabled)
4. Click **Save**

> **Why?** This allows `supabase.auth.signInAnonymously()` to work, which is how the server creates guest accounts.

### 3. Run the Database Schema

Apply the Ludi database schema to create tables and Row Level Security (RLS) policies.

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `server/database/schema.sql`
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

You should see output like:
```
Success. No rows returned
```

#### What the Schema Creates

- **`users` table**: Stores user profiles (linked to `auth.users`)
  - `id`: UUID (references `auth.users.id`)
  - `display_name`: User's display name
  - `avatar_url`: Optional avatar URL
  - `is_guest`: Boolean (true for anonymous users)
  - `created_at`: Timestamp
  
- **`rooms` table**: Persistent record of game rooms
- **`matches` table**: Completed game records
- **`match_players` table**: Junction table for match participants

- **RLS Policies**: Security rules that restrict data access:
  - Users can read any profile
  - Users can only update their own profile
  - Users can only read matches they participated in

### 4. Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:

   - **Project URL**: `https://xxxxx.supabase.co`
   - **`service_role` key** (⚠️ SECRET): The **second** key in the "Project API keys" section

> **⚠️ CRITICAL**: Copy the **`service_role`** key, **NOT** the `anon` (public) key.
> The service role key has admin privileges and must **never** be committed to git or exposed to clients.

### 5. Configure Server Environment Variables

1. Copy `server/.env.example` to `server/.env`:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Edit `server/.env` and update the Supabase credentials:
   ```bash
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```

3. **Never commit `server/.env`** to git. It's already in `.gitignore`.

### 6. Verify Setup

Start the server and check the logs:

```bash
cd /workspace
pnpm dev:server
```

You should see:
```
🎲 Ludi server running on http://localhost:3000
🔌 Socket.IO ready for connections
```

If Supabase is **not** configured, you'll see:
```
⚠️  Supabase not configured, M5.1 features disabled
```

If Supabase **is** configured correctly, there will be **no warning** about Supabase.

## Testing Guest Authentication

### Test 1: Create a Guest User

```bash
curl -X POST http://localhost:3000/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"displayName":"TestGuest"}'
```

Expected response:
```json
{
  "success": true,
  "userId": "a1b2c3d4-...",
  "accessToken": "eyJhbGci..."
}
```

### Test 2: Verify User in Supabase

1. Go to **Authentication** → **Users** in Supabase dashboard
2. You should see a new anonymous user (no email)
3. Go to **Table Editor** → **users**
4. You should see a row with:
   - `display_name`: "TestGuest"
   - `is_guest`: `true`

### Test 3: Mobile Guest Auth

1. Start the mobile app:
   ```bash
   pnpm dev:mobile
   ```

2. On the home screen, tap **"Play as Guest"** (or equivalent)
3. The app should:
   - Call `/auth/guest` on the server
   - Receive a userId and accessToken
   - Store them in secure storage
   - Navigate to the lobby

Check the server logs for:
```
[Auth] Guest user created: <userId>
```

## Behavior Without Supabase

If Supabase is **not configured** (missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`):

1. Server logs a warning at startup:
   ```
   ⚠️  Supabase not configured, M5.1 features disabled
   ```

2. Auth endpoints return **503 Service Unavailable**:
   ```bash
   curl http://localhost:3000/auth/guest
   # → {"success":false,"error":"Auth service not available"}
   ```

3. Mobile app shows an error:
   ```
   "Authentication service not available. Please try again later."
   ```

4. The app **does NOT hang** — the error is clear and immediate.

## Railway Deployment (Hosted Game Server)

Railway is the recommended platform for deploying the full Ludi Socket.IO server (Express + Socket.IO + real-time game rooms).

> **Note**: Vercel is **not suitable** for hosting the game server — Vercel serverless functions cannot run Socket.IO or stateful game rooms. Use Railway, Render, or Fly.io instead.

### Prerequisites

1. A Railway account ([railway.app](https://railway.app))
2. Completed local Supabase setup (Steps 1-4 above)
3. Your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `server/.env`

### Deployment Steps

#### 1. Create a Railway Project

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub repo"** (or connect your GitHub account)
3. Select the `ludi` repository
4. Railway will detect the `Dockerfile` at the repo root and use it automatically

#### 2. Configure Environment Variables

In the Railway project dashboard:

1. Go to **Variables** tab
2. Add the following secrets (click **"+ New Variable"** for each):

   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```

3. **Optional (for LiveKit video chat, M4)**:
   ```
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

4. `PORT` is automatically set by Railway (you don't need to add it)

> **⚠️ Security**: These are the same credentials from your local `server/.env`. Never commit them to git or include them in the PR.

#### 3. Deploy

1. Railway will automatically deploy after detecting the Dockerfile
2. Wait for the build to complete (~2-3 minutes)
3. Once deployed, Railway provides a public HTTPS URL like:
   ```
   https://ludi-production.up.railway.app
   ```

#### 4. Smoke Test the Deployed Server

##### Test Health Endpoint

```bash
curl https://ludi-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-10-02T20:30:00.000Z"
}
```

##### Test Guest Authentication

```bash
curl -X POST https://ludi-production.up.railway.app/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"displayName":"HostedSmoke"}'
```

Expected response:
```json
{
  "success": true,
  "userId": "a1b2c3d4-...",
  "accessToken": "eyJhbGci..."
}
```

##### Test Missing Secrets (503 Error)

If you forgot to set `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`, the server should return a clear error (not hang):

```bash
curl -X POST https://ludi-production.up.railway.app/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test"}'
```

Response with missing secrets:
```json
{
  "success": false,
  "error": "Auth service not available"
}
```

#### 5. Connect the Mobile App

Update the mobile app's environment variables:

**In `apps/mobile/.env`:**
```bash
EXPO_PUBLIC_SOCKET_URL=https://ludi-production.up.railway.app
```

Restart the Expo dev server:
```bash
pnpm dev:mobile
```

The mobile app will now connect to the Railway-hosted server for:
- Guest authentication (`/auth/guest`)
- Socket.IO real-time game rooms
- Match history and profiles

### Architecture Notes

- **Railway** hosts the full Node.js server (Express + Socket.IO)
- Supports stateful game rooms, WebSocket connections, and real-time multiplayer
- Unlike Vercel, Railway runs persistent server processes (not serverless functions)
- All game state is managed server-side for security and consistency

### Troubleshooting Railway Deployment

#### Build Fails: "Cannot find module '@ludi/protocol'"

**Cause**: Dockerfile not copying workspace packages correctly.

**Solution**: Verify `Dockerfile` copies all workspace packages:
```dockerfile
COPY packages/protocol ./packages/protocol
COPY packages/rules ./packages/rules
COPY server ./server
```

#### Server Crashes on Startup

Check Railway logs:
1. Go to **Deployments** tab
2. Click the latest deployment
3. View **Logs**

Common issues:
- Missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` (should log warning, not crash)
- Invalid Supabase credentials (check keys are correct)
- Port binding issues (Railway injects `PORT` automatically)

#### Socket.IO Connections Fail

**Symptoms**: Mobile app shows "Connecting..." indefinitely.

**Solutions**:
1. Verify `EXPO_PUBLIC_SOCKET_URL` uses `https://` (not `http://`)
2. Check Railway service is running (not crashed)
3. Test with `curl` to verify server is reachable
4. Check Railway firewall settings (default allows all HTTPS traffic)

#### Guest Auth Returns 503

**Cause**: Supabase environment variables are not set.

**Solution**:
1. Go to Railway **Variables** tab
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy (Railway auto-redeploys on variable changes)

### Scaling Considerations

- **Free tier**: Suitable for development and small-scale testing
- **Paid tier**: For production with multiple concurrent games
- **Redis**: For multi-instance deployments, replace `RoomRegistry` with Redis-backed storage (future enhancement)

## Deployment Considerations

### Production Environment Variables

When deploying to production (Railway, Render, Fly.io, etc.):

1. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as **environment secrets**
2. **Never** commit real credentials to git
3. Use separate Supabase projects for staging and production

### Database Migrations

As the schema evolves, apply migrations via:
1. Supabase SQL Editor (manual)
2. Supabase CLI migrations (recommended for production)
3. Version control your schema changes in `server/database/`

### Row Level Security (RLS)

The schema includes RLS policies that:
- Allow users to read any profile (needed for lobby and game UI)
- Restrict users to updating only their own profile
- Restrict match history to participants

For production, review and test RLS policies carefully.

## Troubleshooting

### Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"

**Cause**: The server cannot find the environment variables.

**Solutions**:
1. Verify `server/.env` exists and contains both variables
2. Check spelling and casing (must match exactly)
3. Restart the server after editing `.env`
4. Ensure `.env` is in the `server/` directory, not workspace root
5. Verify `import 'dotenv/config'` is at the top of `server/src/index.ts`

### Error: "Invalid API key"

**Cause**: The `SUPABASE_SERVICE_ROLE_KEY` is incorrect or expired.

**Solutions**:
1. Verify you copied the **service_role** key, not the `anon` key
2. Check for extra spaces or truncated characters
3. Regenerate the key in Supabase dashboard if needed

### Error: "relation 'users' does not exist"

**Cause**: The database schema has not been applied.

**Solutions**:
1. Go to SQL Editor in Supabase dashboard
2. Run `server/database/schema.sql` as described in Step 3

### Anonymous Sign-Ins Not Working

**Cause**: Anonymous provider is not enabled in Supabase.

**Solutions**:
1. Go to **Authentication** → **Providers**
2. Ensure **"Anonymous sign-ins"** is toggled **ON**
3. Click **Save**

### Mobile App Hangs on "Authenticating..."

**Possible causes**:
1. Server is not running (`pnpm dev:server`)
2. `EXPO_PUBLIC_SOCKET_URL` in mobile `.env` is incorrect
3. Firewall blocking connections
4. Server is running but Supabase is not configured (check server logs for 503 errors)

## Need Help?

1. Check the server logs for detailed error messages
2. Verify each setup step was completed
3. Test with `curl` to isolate client vs server issues
4. Check Supabase dashboard logs under **Logs** → **Auth**

## Summary Checklist

- [ ] Created Supabase project
- [ ] Enabled Anonymous sign-ins provider
- [ ] Ran `server/database/schema.sql` in SQL Editor
- [ ] Copied Project URL and service_role key
- [ ] Created `server/.env` with correct credentials
- [ ] Started server with no Supabase warnings
- [ ] Tested `/auth/guest` endpoint with curl
- [ ] Verified guest user in Supabase dashboard
- [ ] Tested mobile guest auth flow
- [ ] Confirmed session persists after app restart

Once all steps are complete, guest authentication is fully functional! 🎉
