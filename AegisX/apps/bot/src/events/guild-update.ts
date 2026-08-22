import {
  AuditLogEvent,
  type Guild,
} from "discord.js";
import { antiNukeService } from "../security/antinuke/index.js";

export async function handleGuildUpdate(
  oldGuild: Guild,
  newGuild: Guild,
): Promise<void> {
  try {
    await antiNukeService.handle(newGuild, {
      eventName: "guildUpdate",
      action: AuditLogEvent.GuildUpdate,
      targetId: newGuild.id,
      actionType: "serverup",
      immediatePunish: true,
      onRecover: async () => {
        if (oldGuild.name !== newGuild.name && newGuild.members.me?.permissions.has("ManageGuild")) {
          await newGuild.setName(oldGuild.name, "Anti-Nuke: Reverting guild name");
        }
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke guild update handler failed in guild ${newGuild.id}:`,
      error,
    );
  }
}
