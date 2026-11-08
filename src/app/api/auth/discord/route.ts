import { NextResponse } from "next/server";
import { appUrl } from "@/lib/utils";

// Step 1 of Discord login: redirect the user to Discord's consent screen.
export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "DISCORD_CLIENT_ID is not set (add it to .env.local locally, or to the Netlify environment variables when deployed)" },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = process.env.DISCORD_REDIRECT_URI ?? `${appUrl()}/api/auth/callback`;

  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url.toString());
  // Store state in a short-lived cookie to prevent CSRF on the callback.
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
