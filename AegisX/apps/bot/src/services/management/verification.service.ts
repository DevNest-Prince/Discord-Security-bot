import {
  type ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export function createVerificationPanel(guildName: string): {
  embed: EmbedBuilder;
  row: ActionRowBuilder<ButtonBuilder>;
} {
  const embed = new EmbedBuilder()
    .setColor(AegisColors.Primary)
    .setTitle(`🛡️ Server Verification • ${guildName}`)
    .setDescription(
      `Welcome to **${guildName}**!\n\n` +
      `To gain access to the channels and protect the community from automated raid accounts, please complete verification by clicking the button below.\n\n` +
      `*By verifying, you agree to follow the server rules and Discord Terms of Service.*`
    )
    .setFooter({ text: "AegisX Security Gatekeeper" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("aegis_verify_btn")
      .setLabel("Verify & Access Server")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
  );

  return { embed, row };
}

export async function handleVerificationInteraction(
  interaction: ButtonInteraction,
): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  const config = await getGuildConfig(interaction.guild.id);
  const verification = config.verification;

  if (!verification || !verification.enabled || !verification.verifiedRoleId) {
    await interaction.reply({
      content: "⚠️ Verification system is currently not configured or disabled.",
      ephemeral: true,
    });
    return;
  }

  const role = interaction.guild.roles.cache.get(verification.verifiedRoleId);
  if (!role) {
    await interaction.reply({
      content: "❌ Verification role was not found. Please notify server staff.",
      ephemeral: true,
    });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member) return;

  if (member.roles.cache.has(role.id)) {
    await interaction.reply({
      content: "✨ You are already verified in this server!",
      ephemeral: true,
    });
    return;
  }

  try {
    await member.roles.add(role, "AegisX One-Click Verification");
    await interaction.reply({
      content: `🎉 **Successfully verified!** You have been granted the **@${role.name}** role. Enjoy your stay!`,
      ephemeral: true,
    });
  } catch (err) {
    console.error(`[Verification] Failed to grant role in ${interaction.guild.id}:`, err);
    await interaction.reply({
      content: "❌ Failed to assign verified role. Please check bot permissions hierarchy.",
      ephemeral: true,
    });
  }
}
