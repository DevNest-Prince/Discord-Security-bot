import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { getGuildConfig, updateLimitsConfig } from "@aegisx/database";
import { deleteGuildConfigCache } from "@aegisx/redis";

export const limitCommand = {
  data: new SlashCommandBuilder()
    .setName("limit")
    .setDescription("Configure staff action rate limits")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set action rate limit")
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("The action to limit")
            .setRequired(true)
            .addChoices(
              { name: "Ban Members", value: "ban" },
              { name: "Kick Members", value: "kick" },
              { name: "Channel Create", value: "chcr" },
              { name: "Channel Delete", value: "chdl" },
              { name: "Role Create", value: "rlcr" },
              { name: "Role Delete", value: "rldl" },
              { name: "Webhook Create", value: "webhook" },
            ),
        )
        .addIntegerOption((opt) =>
          opt.setName("count").setDescription("Maximum allowed actions in timeframe").setRequired(true).setMinValue(1),
        )
        .addIntegerOption((opt) =>
          opt.setName("seconds").setDescription("Timeframe window in seconds").setRequired(true).setMinValue(5),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("View current staff action limits"),
    )
    .addSubcommand((sub) =>
      sub.setName("reset").setDescription("Reset action limits to default"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "❌ Server only command.", ephemeral: true });
      return;
    }

    const guild = interaction.guild;
    const authorId = interaction.user.id;
    const isOwner = guild.ownerId === authorId;

    if (!isOwner) {
      await interaction.reply({
        content: "❌ **Access Denied**: Only the primary Server Owner can configure Action Limits.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const config = await getGuildConfig(guild.id);

    if (subcommand === "set") {
      const action = interaction.options.getString("action", true);
      const count = interaction.options.getInteger("count", true);
      const seconds = interaction.options.getInteger("seconds", true);

      const limits = config.limits?.limits ?? {};
      (limits as any)[action] = { count, windowSeconds: seconds, action: "strip_roles" };

      await updateLimitsConfig(guild.id, { enabled: true, limits });
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        content: `✅ Limit for **${action}** set to **${count} actions per ${seconds} seconds** (Punishment: Strip Roles).`,
      });
    } else if (subcommand === "view") {
      const limits = config.limits?.limits ?? {};
      const entries = Object.entries(limits);

      if (entries.length === 0) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`🎚️ Staff Action Limits — ${guild.name}`)
              .setColor(0x5865f2)
              .setDescription("ℹ️ No custom action limits configured. Default safety rules are active."),
          ],
        });
        return;
      }

      const lines = entries.map(([act, cfg]: [string, any]) => `• **${act}**: Max **${cfg.count}** in \`${cfg.windowSeconds}s\` (Action: \`${cfg.action ?? "strip_roles"}\`)`);

      const embed = new EmbedBuilder()
        .setTitle(`🎚️ Staff Action Limits — ${guild.name}`)
        .setColor(0x00ff00)
        .setDescription(lines.join("\n"));

      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "reset") {
      await updateLimitsConfig(guild.id, { enabled: false, limits: {} as any });
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({ content: "✅ Action limits reset to defaults." });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    const guild = message.guild;
    const isOwner = guild.ownerId === message.author.id;

    if (!isOwner) {
      await message.reply("❌ **Access Denied**: Only primary Server Owner can manage Action Limits.");
      return;
    }

    const sub = args[0]?.toLowerCase();
    const config = await getGuildConfig(guild.id);

    if (sub === "set") {
      const action = args[1]?.toLowerCase();
      const count = parseInt(args[2] || "3", 10);
      const seconds = parseInt(args[3] || "60", 10);

      if (!action || isNaN(count) || isNaN(seconds)) {
        await message.reply("❌ Usage: `>limit set <ban|kick|chcr|chdl|rlcr|rldl> <count> <seconds>`");
        return;
      }

      const limits = config.limits?.limits ?? {};
      (limits as any)[action] = { count, windowSeconds: seconds, action: "strip_roles" };

      await updateLimitsConfig(guild.id, { enabled: true, limits });
      await deleteGuildConfigCache(guild.id);

      await message.reply(`✅ Limit for **${action}** set to **${count} per ${seconds}s**.`);
    } else {
      const limits = config.limits?.limits ?? {};
      const entries = Object.entries(limits);
      const lines = entries.length > 0
        ? entries.map(([act, cfg]: [string, any]) => `• **${act}**: Max **${cfg.count}** in \`${cfg.windowSeconds}s\``).join("\n")
        : "*No custom limits configured.*";

      const embed = new EmbedBuilder()
        .setTitle(`🎚️ Staff Action Limits — ${guild.name}`)
        .setColor(0x5865f2)
        .setDescription(`${lines}\n\n*Usage: \`>limit set <action> <count> <seconds>\`*`);

      await message.reply({ embeds: [embed] });
    }
  },
};
