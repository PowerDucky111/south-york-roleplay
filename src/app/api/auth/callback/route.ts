import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/session";
import { hasPermission } from "@/lib/auth";
import { getMember, displayName } from "@/lib/discord";
import { ensureMemberCallsign, syncMemberNickname } from "@/lib/callsign";
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
  const redirectUri = process.env.DISCORD_REDIRECT_URL ?? `${appUrl()}/api/auth/callback`;
  if (!clientId || !clientSecret) {
    return fail("missing_oauth_config");
  }

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

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userRes.ok) return fail("profile_fetch_failed");
  const user = (await userRes.json()) as DiscordUser;

  // The bot verifies guild membership. Panel authorization is managed in D1.
  let guildMember: Awaited<ReturnType<typeof getMember>>;
  try {
    guildMember = await getMember(user.id);
  } catch (error) {
    const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`[OAuth] Discord membership check failed: ${details}`);
    return fail("not_member");
  }

  try {
    const callsign = await ensureMemberCallsign(user, displayName(guildMember));
    try {
      await syncMemberNickname(user.id, callsign, displayName(guildMember));
    } catch (error) {
      console.warn("[OAuth] Discord nickname update failed:", {
        userId: user.id,
        callsign,
        errorName: error instanceof Error ? error.name : "Unknown",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    console.error(`[OAuth] Could not provision callsign for ${user.id}:`, error);
  }

  await createSession(user);
  const admin = await hasPermission(user.id, "admin.access");
  const res = NextResponse.redirect(`${appUrl()}${admin ? "/dashboard" : "/portal"}`);
  res.cookies.delete("oauth_state");
  return res;
}
