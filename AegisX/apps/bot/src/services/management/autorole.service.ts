import { type GuildMember } from "discord.js";
import { getGuildConfig } from "@aegisx/database";

export async function handleAutoRole(member: GuildMember): Promise<void> {
  const config = await getGuildConfig(member.guild.id);
  const autorole = config.autorole;
  if (!autorole) return;

  const targetRoles = member.user.bot
    ? autorole.bots || []
    : autorole.humans || [];

  if (targetRoles.length === 0) return;

  for (const roleId of targetRoles) {
    const role = member.guild.roles.cache.get(roleId);
    if (role && !member.roles.cache.has(roleId)) {
      try {
        await member.roles.add(role, "AegisX AutoRole Assignment");
      } catch (err) {
        console.error(`[AutoRole] Failed to assign role ${roleId} in ${member.guild.id}:`, err);
      }
    }
  }
}
