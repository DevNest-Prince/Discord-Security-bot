import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import {
  getGuildConfig,
  updateAutomodConfig,
} from "@aegisx/database";
import { deleteGuildConfigCache } from "@aegisx/redis";

export const automodCommand = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configure AutoMod rules, punishments, and logging")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("enable").setDescription("Enable AutoMod protection on the server"),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable AutoMod protection on the server"),
    )
    .addSubcommand((sub) =>
      sub.setName("config").setDescription("View current AutoMod configuration"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("punishment")
        .setDescription("Set punishment action for specific AutoMod event")
        .addStringOption((opt) =>
          opt
            .setName("event")
            .setDescription("The AutoMod event rule")
            .setRequired(true)
            .addChoices(
              { name: "Anti Link", value: "Anti link" },
              { name: "Anti Invites", value: "Anti invites" },
              { name: "Anti Spam", value: "Anti spam" },
              { name: "Anti Caps", value: "Anti caps" },
              { name: "Anti Mass Mention", value: "Anti mass mention" },
              { name: "Anti Emoji Spam", value: "Anti emoji spam" },
            ),
        )
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Punishment to apply")
            .setRequired(true)
            .addChoices(
              { name: "Mute / Timeout", value: "Mute" },
              { name: "Kick", value: "Kick" },
              { name: "Ban", value: "Ban" },
              { name: "Delete Message Only", value: "Block" },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("logging")
        .setDescription("Set AutoMod incident logging channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target text channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("ignore")
        .setDescription("Exempt channels or roles from AutoMod")
        .addSubcommand((sub) =>
          sub
            .setName("channel")
            .setDescription("Exempt a channel from AutoMod")
            .addChannelOption((opt) =>
              opt
                .setName("channel")
                .setDescription("Channel to ignore")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("role")
            .setDescription("Exempt a role from AutoMod")
            .addRoleOption((opt) =>
              opt.setName("role").setDescription("Role to ignore").setRequired(true),
            ),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("unignore")
        .setDescription("Remove exemptions from AutoMod")
        .addSubcommand((sub) =>
          sub
            .setName("channel")
            .setDescription("Remove channel from ignore list")
            .addChannelOption((opt) =>
              opt
                .setName("channel")
                .setDescription("Channel to unignore")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("role")
            .setDescription("Remove role from ignore list")
            .addRoleOption((opt) =>
              opt.setName("role").setDescription("Role to unignore").setRequired(true),
            ),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "❌ Server only command.", ephemeral: true });
      return;
    }

    const guild = interaction.guild;
    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    const config = await getGuildConfig(guild.id);

    if (group === "ignore") {
      if (subcommand === "channel") {
        const channel = interaction.options.getChannel("channel", true);
        const ignoredChannels = config.automod?.ignoredChannels ?? [];
        if (!ignoredChannels.includes(channel.id)) {
          ignoredChannels.push(channel.id);
          await updateAutomodConfig(guild.id, { ignoredChannels });
          await deleteGuildConfigCache(guild.id);
        }
        await interaction.reply({ content: `✅ <#${channel.id}> added to AutoMod ignore list.` });
      } else if (subcommand === "role") {
        const role = interaction.options.getRole("role", true);
        const ignoredRoles = config.automod?.ignoredRoles ?? [];
        if (!ignoredRoles.includes(role.id)) {
          ignoredRoles.push(role.id);
          await updateAutomodConfig(guild.id, { ignoredRoles });
          await deleteGuildConfigCache(guild.id);
        }
        await interaction.reply({ content: `✅ <@&${role.id}> added to AutoMod ignore list.` });
      }
      return;
    }

    if (group === "unignore") {
      if (subcommand === "channel") {
        const channel = interaction.options.getChannel("channel", true);
        const ignoredChannels = (config.automod?.ignoredChannels ?? []).filter((id) => id !== channel.id);
        await updateAutomodConfig(guild.id, { ignoredChannels });
        await deleteGuildConfigCache(guild.id);
        await interaction.reply({ content: `✅ <#${channel.id}> removed from AutoMod ignore list.` });
      } else if (subcommand === "role") {
        const role = interaction.options.getRole("role", true);
        const ignoredRoles = (config.automod?.ignoredRoles ?? []).filter((id) => id !== role.id);
        await updateAutomodConfig(guild.id, { ignoredRoles });
        await deleteGuildConfigCache(guild.id);
        await interaction.reply({ content: `✅ <@&${role.id}> removed from AutoMod ignore list.` });
      }
      return;
    }

    if (subcommand === "enable") {
      await updateAutomodConfig(guild.id, { enabled: true });
      await deleteGuildConfigCache(guild.id);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`🛡️ AutoMod Enabled — ${guild.name}`)
            .setColor(0x00ff00)
            .setDescription("✅ **AutoMod protection is now active on this server!**\nUse `/automod config` to view rules."),
        ],
      });
    } else if (subcommand === "disable") {
      await updateAutomodConfig(guild.id, { enabled: false });
      await deleteGuildConfigCache(guild.id);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`🛡️ AutoMod Disabled — ${guild.name}`)
            .setColor(0xff0000)
            .setDescription("🔴 **AutoMod protection has been disabled on this server.**"),
        ],
      });
    } else if (subcommand === "punishment") {
      const event = interaction.options.getString("event", true);
      const action = interaction.options.getString("action", true);

      const punishments = config.automod?.punishments ?? {};
      punishments[event] = action;

      await updateAutomodConfig(guild.id, { punishments });
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        content: `✅ Punishment for **${event}** set to **${action}**.`,
      });
    } else if (subcommand === "logging") {
      const channel = interaction.options.getChannel("channel", true);
      await updateAutomodConfig(guild.id, { loggingChannel: channel.id });
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        content: `✅ AutoMod incidents will now be logged in <#${channel.id}>.`,
      });
    } else if (subcommand === "config") {
      const automod = config.automod;
      const isEnabled = automod?.enabled ?? false;
      const punishments = automod?.punishments ?? {};

      const ruleLines = Object.entries(punishments)
        .map(([k, v]) => `• **${k}**: \`${v}\``)
        .join("\n");

      const ignoredChannels = (automod?.ignoredChannels ?? []).map((id) => `<#${id}>`).join(", ") || "*None*";
      const ignoredRoles = (automod?.ignoredRoles ?? []).map((id) => `<@&${id}>`).join(", ") || "*None*";
      const logChannel = automod?.loggingChannel ? `<#${automod.loggingChannel}>` : "*Not configured*";

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ AutoMod Configuration — ${guild.name}`)
        .setColor(isEnabled ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "Status", value: isEnabled ? "🟢 **ENABLED**" : "🔴 **DISABLED**", inline: true },
          { name: "Logging Channel", value: logChannel, inline: true },
          { name: "Ignored Channels", value: ignoredChannels, inline: false },
          { name: "Ignored Roles", value: ignoredRoles, inline: false },
          { name: "Active Rules & Punishments", value: ruleLines || "*No rules configured*", inline: false },
        )
        .setFooter({ text: "Use /automod punishment to modify actions" });

      await interaction.reply({ embeds: [embed] });
    }
  },
};
