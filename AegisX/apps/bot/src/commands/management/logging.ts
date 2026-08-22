import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  type Message,
} from "discord.js";
import { getGuildConfig, updateLoggingConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export const loggingCommand = {
  data: new SlashCommandBuilder()
    .setName("logging")
    .setDescription("Configure server audit logging channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set audit log channel for a specific event")
        .addStringOption((opt) =>
          opt
            .setName("event")
            .setDescription("Log event type")
            .setRequired(true)
            .addChoices(
              { name: "All Events (Universal)", value: "all" },
              { name: "Channel Updates", value: "channels" },
              { name: "Role Updates", value: "roles" },
              { name: "Member Bans / Unbans", value: "bans" },
              { name: "Member Join / Leave", value: "members" },
              { name: "Message Delete / Edit", value: "messages" },
              { name: "Voice State Updates", value: "voice" },
            ),
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Audit log destination channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("View current audit logging channels configuration"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();
    const config = await getGuildConfig(interaction.guild.id);
    const current = config.logging || { logEnabled: {}, logChannels: {} };

    if (sub === "set") {
      const event = interaction.options.getString("event", true);
      const channel = interaction.options.getChannel("channel", true);

      const logChannels = { ...(current.logChannels || {}), [event]: channel.id };
      const logEnabled = { ...(current.logEnabled || {}), [event]: true };

      await updateLoggingConfig(interaction.guild.id, {
        ...current,
        logChannels,
        logEnabled,
      });

      await interaction.reply({
        content: `✅ Logging channel for **${event}** has been set to <#${channel.id}>.`,
      });
    } else if (sub === "status") {
      const channels = current.logChannels || {};
      const entries = Object.entries(channels);

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("📜 Server Audit Log Configuration")
        .setDescription(
          entries.length === 0
            ? "*No logging channels configured yet. Use `/logging set` to configure.*"
            : entries.map(([evt, id]) => `• **${evt}:** <#${id}>`).join("\n"),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    const sub = args[0]?.toLowerCase();
    const config = await getGuildConfig(message.guild.id);
    const current = config.logging || { logEnabled: {}, logChannels: {} };

    if (sub === "set" || sub === "all") {
      const event = sub === "all" ? "all" : (args[1]?.toLowerCase() || "all");
      const channel = message.mentions.channels.first() || (args[2] ? message.guild.channels.cache.get(args[2]) : undefined);

      if (!channel) {
        await message.reply({ content: "❌ **Usage:** `>logging all <#channel>` or `>logging set <event> <#channel>`" });
        return;
      }

      const logChannels = { ...(current.logChannels || {}), [event]: channel.id };
      const logEnabled = { ...(current.logEnabled || {}), [event]: true };


      await updateLoggingConfig(message.guild.id, {
        ...current,
        logChannels,
        logEnabled,
      });

      await message.reply({ content: `✅ Logging for **${event}** directed to <#${channel.id}>!` });
    } else {
      const channels = current.logChannels || {};
      const entries = Object.entries(channels);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("📜 Audit Logging Channels")
        .setDescription(
          `**Commands:**\n` +
          `• \`>logging all <#channel>\` — Direct all logs to channel\n` +
          `• \`>logging set <event> <#channel>\`\n\n` +
          `**Configured Channels:**\n` +
          (entries.length === 0 ? "*None*" : entries.map(([e, id]) => `• **${e}:** <#${id}>`).join("\n")),
        );
      await message.reply({ embeds: [embed] });
    }
  },
};
