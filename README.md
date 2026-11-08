# South York Roleplay — Staff CMS

A community management dashboard for the **South York Roleplay** FiveM community.
Staff sign in with Discord and can view all server members, assign roles, and
moderate (kick / ban / timeout / unban) — all synced live with Discord.

Built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. No separate bot
process is needed — the app talks to the Discord REST API directly using your
bot token.

---

## Features

- **Discord OAuth login** — staff authenticate with their Discord account
- **Member browser** — search and filter every member in the server
- **Role management** — assign/remove roles via a checkbox editor
- **Moderation** — kick, ban (with message purge), timeout (up to 28 days), unban
- **Roles page** — every role with live member counts
- **Moderation page** — ban list with one-click unban
- **Admin gating** — only Discord users with *Administrator* or *Manage Server*
  permissions (or IDs listed in `ADMIN_DISCORD_IDS`) can sign in

---

## Setup

### 1. Install dependencies

```powershell
cd south-york-roleplay
npm install
```

### 2. Create a Discord application

1. Go to <https://discord.com/developers/applications> → **New Application**
   (name it e.g. "SYRP Staff CMS").
2. In the **Bot** tab → **Reset Token** → copy the token
   (`DISCORD_BOT_TOKEN`).
3. Still in the **Bot** tab, enable **Server Members Intent**
   (Privileged Gateway Intents). Not strictly required for the REST API, but
   recommended.
4. In **OAuth2 → General**, add this **Redirect**:
   `http://localhost:3000/api/auth/callback`
   (add your production URL too if you deploy, e.g.
   `https://yourdomain.com/api/auth/callback`)
5. Copy the **Client ID** and **Client Secret** from the **OAuth2** page.

### 3. Invite the bot to your server

Use this URL (replace `CLIENT_ID` and `GUILD_ID`):

```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot
```

`permissions=8` grants **Administrator** — the simplest option. For finer
control use the permission integer for: View Channels, Manage Roles, Kick
Members, Ban Members, Moderate Members, Manage Nicknames.

**Important:** the bot's highest role must be **above** any role you want to
assign in Discord's role list (Server Settings → Roles, drag to reorder).

### 4. Find your Server ID

Discord app → Settings → Advanced → enable **Developer Mode**. Right-click
your server icon → **Copy Server ID** → `DISCORD_GUILD_ID`.

### 5. Configure environment

```powershell
copy .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `DISCORD_CLIENT_ID` | Developer Portal → OAuth2 |
| `DISCORD_CLIENT_SECRET` | Developer Portal → OAuth2 |
| `DISCORD_REDIRECT_URI` | `http://localhost:3000/api/auth/callback` |
| `DISCORD_BOT_TOKEN` | Developer Portal → Bot |
| `DISCORD_GUILD_ID` | Right-click server → Copy Server ID |
| `SESSION_SECRET` | Any long random string |
| `ADMIN_DISCORD_IDS` | Your Discord user ID (optional but recommended) |

To get your user ID: Developer Mode → right-click your profile → **Copy User ID**.

### 6. Run

```powershell
npm run dev
```

Open <http://localhost:3000> and click **Sign in with Discord**.

---

## Project structure

```
src/
  app/
    page.tsx                  Landing / login page
    dashboard/page.tsx        Server overview stats
    members/page.tsx          Member browser
    roles/page.tsx            Role list with member counts
    moderation/page.tsx       Ban list + unban
    api/
      auth/discord/route.ts   Starts Discord OAuth
      auth/callback/route.ts  Handles OAuth callback
      auth/logout/route.ts    Signs out
      members/route.ts        GET member list
      members/[id]/route.ts   PATCH roles
      members/[id]/kick/      POST kick
      members/[id]/ban/       PUT ban
      members/[id]/timeout/   PATCH timeout
      bans/route.ts           GET ban list
      bans/[userId]/route.ts  DELETE unban
      guild/route.ts          GET server stats
  components/
    app-shell.tsx             Sidebar layout wrapper
    sidebar.tsx               Navigation sidebar
    member-table.tsx          Searchable member table + action modals
    bans-table.tsx            Ban list with unban buttons
  lib/
    discord.ts                All Discord REST API calls + types
    auth.ts                   Admin permission checks
    session.ts                JWT session cookie (jose)
    utils.ts                  Small helpers
```

## Deploying

Any Node.js host works (Vercel, Railway, a VPS). Set the same env vars in the
host's dashboard, set `NEXT_PUBLIC_APP_URL` and `DISCORD_REDIRECT_URI` to your
production domain, and add that redirect URL in the Discord Developer Portal.

## Notes & limits

- Member list is fetched live from Discord on each page load (cached per
  request only). Very large servers may take a moment.
- Discord rate-limits the API; the UI shows errors if you hit them — just
  refresh and try again.
- The bot cannot moderate the server owner or users with higher permissions
  than the bot.
- Timeout max duration is 28 days (Discord limit).
