import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/session";
import { isAdmin } from "@/lib/auth";
import { appUrl } from "@/lib/utils";
import type { DiscordUser } from "@/lib/discord";

// Step 2: Discord redirects here with ?code=...&state=...
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(`${appUrl()}/?error=${encodeURIComponent(reason)}`);

  if (!code || !state || state !== savedState) {
    return fail("invalid_state");
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI ?? `${appUrl()}/api/auth/callback`;
  if (!clientId || !clientSecret) {
    return fail("missing_oauth_config");
  }

  // Exchange the code for an access token.
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) return fail("token_exchange_failed");
  const tokenData = await tokenRes.json();

  // Fetch the user's profile.
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userRes.ok) return fail("profile_fetch_failed");
  const user = (await userRes.json()) as DiscordUser;

  // Only staff (admins) may enter the CMS.
  if (!(await isAdmin(user.id))) {
    return fail("not_authorized");
  }

  await createSession(user);

  const res = NextResponse.redirect(`${appUrl()}/dashboard`);
  res.cookies.delete("oauth_state");
  return res;
}
