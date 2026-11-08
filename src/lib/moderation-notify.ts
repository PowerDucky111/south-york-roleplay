import { sendDMEmbed } from "./discord";

export type ModerationAction = "kick" | "ban" | "timeout" | "unban";

export interface NotifyOptions {
  action: ModerationAction;
  // For timeouts: how long the action lasts. Undefined/null for permanent actions.
  durationLabel?: string | null;
  // Optional end time for timeouts, e.g. "until 12 Nov 2026, 20:30 UTC".
  endsAtLabel?: string | null;
  moderatorName: string;
  reason?: string | null;
}

const ACTION_TITLES: Record<ModerationAction, string> = {
  kick: "You have been kicked from South York Roleplay",
  ban: "You have been banned from South York Roleplay",
  timeout: "You have been timed out in South York Roleplay",
  unban: "Your ban on South York Roleplay has been lifted",
};

const ACTION_COLORS: Record<ModerationAction, number> = {
  kick: 0xf0b232, // yellow
  ban: 0xed4245, // red
  timeout: 0x5865f2, // blurple
  unban: 0x57f287, // green
};

function guildName(): string {
  return process.env.DISCORD_GUILD_NAME ?? "South York Roleplay";
}

// Sends a DM to the user describing the moderation action.
// Best-effort: failures (e.g. user has DMs disabled) are logged, not thrown,
// so a failed DM never blocks the moderation action itself.
export async function notifyModeration(
  userId: string,
  opts: NotifyOptions
): Promise<void> {
  try {
    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: "Action", value: ACTION_TITLES[opts.action], inline: false },
      {
        name: "Duration",
        value: opts.durationLabel ?? "Permanent",
        inline: true,
      },
    ];

    if (opts.endsAtLabel) {
      fields.push({ name: "Ends", value: opts.endsAtLabel, inline: true });
    }

    fields.push({ name: "Issued by", value: opts.moderatorName, inline: true });

    if (opts.reason) {
      fields.push({ name: "Reason", value: opts.reason, inline: false });
    }

    await sendDMEmbed(userId, {
      title: `Moderation notice — ${guildName()}`,
      description:
        opts.action === "unban"
          ? "Good news — the restriction on your account has been removed. You are welcome back on the server."
          : "A member of the staff team has applied a moderation action to your account. Details below.",
      color: ACTION_COLORS[opts.action],
      fields,
      footer: { text: "South York Roleplay Staff" },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(
      `[moderation-notify] Could not DM user ${userId} about ${opts.action}:`,
      err instanceof Error ? err.message : err
    );
  }
}
