import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { DiscordUser } from "./discord";

const COOKIE_NAME = "syrp_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret === "change_me_to_a_long_random_string") {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .env.local locally, or to the Netlify environment variables when deployed."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  username: string;
  avatar: string | null;
}

export async function createSession(user: DiscordUser): Promise<void> {
  const token = await new SignJWT({
    userId: user.id,
    username: user.global_name ?? user.username,
    avatar: user.avatar,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      avatar: payload.avatar as string | null,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
