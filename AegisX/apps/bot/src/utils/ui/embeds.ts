import { EmbedBuilder, type User } from "discord.js";
import { AegisColors } from "./colors.js";

export function createBaseEmbed(clientUser?: User | null): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(AegisColors.Primary)
    .setTimestamp();

  if (clientUser) {
    embed.setFooter({
      text: `${clientUser.username} • Next-Gen All-in-One Engine`,
      iconURL: clientUser.displayAvatarURL(),
    });
  }
  return embed;
}

export function createSuccessEmbed(title: string, description: string, clientUser?: User | null): EmbedBuilder {
  return createBaseEmbed(clientUser)
    .setColor(AegisColors.Success)
    .setTitle(`✅ ${title}`)
    .setDescription(description);
}

export function createErrorEmbed(title: string, description: string, clientUser?: User | null): EmbedBuilder {
  return createBaseEmbed(clientUser)
    .setColor(AegisColors.Danger)
    .setTitle(`❌ ${title}`)
    .setDescription(description);
}

export function createWarningEmbed(title: string, description: string, clientUser?: User | null): EmbedBuilder {
  return createBaseEmbed(clientUser)
    .setColor(AegisColors.Warning)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description);
}

export function createSecurityEmbed(title: string, description: string, clientUser?: User | null): EmbedBuilder {
  return createBaseEmbed(clientUser)
    .setColor(AegisColors.Dark)
    .setTitle(`🛡️ ${title}`)
    .setDescription(description);
}
