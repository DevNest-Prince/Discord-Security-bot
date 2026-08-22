import {
  EmbedBuilder,
  type Message,
  type TextChannel,
} from "discord.js";
import { autoModService } from "../security/automod/index.js";
import { getGuildConfig } from "../services/guild-config.service.js";
import { securityExemptionService } from "../security/exemptions/security-exemption.service.js";
import { enforcementService } from "../security/enforcement/enforcement.service.js";

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot || !message.guild || !message.member) {
    return;
  }

  const guild = message.guild;
  const author = message.author;
  const member = message.member;

  // 1. Anti-Everyone / Anti-Here Check
  if (message.mentions.everyone) {
    try {
      const config = await getGuildConfig(guild.id);
      if (config.security?.antiNuke?.enabled) {
        const exemption = securityExemptionService.check(guild, author, {
          actionType: "meneve",
          extraOwnerIds: config.security.extraOwners,
          whitelistedUsers: config.security.whitelistedUsers,
        });

        if (!exemption.exempt) {
          // Delete message
          await message.delete().catch(() => null);

          // 1 hour timeout
          await enforcementService.execute({
            guild,
            executorId: author.id,
            action: "timeout",
            reason: "Anti-Nuke: Unauthorized @everyone / @here mention",
            timeoutMinutes: 60,
          });

          // Send warning embed
          if (message.channel && "send" in message.channel) {
            const embed = new EmbedBuilder()
              .setTitle("🚨 Anti-Everyone Triggered")
              .setColor(0xff0000)
              .setDescription(`❌ | <@${author.id}> has been **timed out for 1 hour** for unauthorized \`@everyone\` / \`@here\` mention.`)
              .setFooter({ text: `AegisX Security Defense`, iconURL: guild.client.user?.displayAvatarURL() });

            const alertMsg = await (message.channel as TextChannel).send({ embeds: [embed] });
            setTimeout(() => alertMsg.delete().catch(() => null), 15_000);
          }

          return;
        }
      }
    } catch (err) {
      console.error("⚠️ Anti-Everyone check error:", err);
    }
  }

  // 2. AutoMod Pipeline
  const automodHandled = await autoModService.handleMessage(message);
  if (automodHandled) {
    return;
  }
}
