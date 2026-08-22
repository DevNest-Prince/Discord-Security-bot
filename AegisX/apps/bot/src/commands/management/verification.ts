import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  type Message,
  type TextChannel,
} from "discord.js";
import { getGuildConfig, updateVerificationConfig } from "@aegisx/database";
import { createVerificationPanel } from "../../services/management/verification.service.js";

export const verificationCommand = {
  data: new SlashCommandBuilder()
    .setName("verification")
    .setDescription("Configure server entry verification gatekeeper")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Deploy an interactive verification panel into a channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Verification channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addRoleOption((opt) =>
          opt
            .setName("role")
            .setDescription("Verified role to give")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable the verification gatekeeper"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true) as TextChannel;
      const role = interaction.options.getRole("role", true);

      await updateVerificationConfig(interaction.guild.id, {
        enabled: true,
        verificationChannelId: channel.id,
        verifiedRoleId: role.id,
        verificationMethod: "button",
      });

      const { embed, row } = createVerificationPanel(interaction.guild.name);
      await channel.send({ embeds: [embed], components: [row] });

      await interaction.reply({
        content: `✅ **Verification panel deployed** in <#${channel.id}>! Members clicking the button will receive <@&${role.id}>.`,
      });
    } else if (sub === "disable") {
      await updateVerificationConfig(interaction.guild.id, {
        enabled: false,
      });
      await interaction.reply({ content: "⚠️ Verification gatekeeper has been disabled." });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "setup") {
      const channel = message.mentions.channels.first() || (args[1] ? message.guild.channels.cache.get(args[1]) : undefined) as TextChannel | undefined;
      const role = message.mentions.roles.first() || (args[2] ? message.guild.roles.cache.get(args[2]) : undefined);

      if (!channel || !role) {
        await message.reply({ content: "❌ **Usage:** `>verification setup <#channel> <@role>`" });
        return;
      }

      await updateVerificationConfig(message.guild.id, {
        enabled: true,
        verificationChannelId: channel.id,
        verifiedRoleId: role.id,
        verificationMethod: "button",
      });

      const { embed, row } = createVerificationPanel(message.guild.name);
      await (channel as TextChannel).send({ embeds: [embed], components: [row] });
      await message.reply({ content: `✅ Verification panel sent to <#${channel.id}> with role <@&${role.id}>!` });
    } else if (sub === "disable") {
      await updateVerificationConfig(message.guild.id, { enabled: false });
      await message.reply({ content: "⚠️ Verification system disabled." });
    } else {
      await message.reply({
        content: "🛡️ **Verification Setup:**\n• `>verification setup <#channel> <@role>`\n• `>verification disable`",
      });
    }
  },
};
