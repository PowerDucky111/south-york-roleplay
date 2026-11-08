import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { appUrl } from "@/lib/utils";

export async function POST() {
  await destroySession();
  return NextResponse.redirect(appUrl(), { status: 303 });
}
