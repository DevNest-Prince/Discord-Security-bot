import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type Message,
} from "discord.js";
import { whitelistService } from "../../services/security/whitelist.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const whitelistCommand = {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Module-Specific Whitelist Engine (Users, Roles, Channels, Bots)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add target to a specific module's whitelist")
        .addStringOption((opt) => opt.setName("target_id").setDescription("User, Role, or Channel ID").setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Target entity type")
            .setRequired(true)
            .addChoices(
              { name: "User", value: "user" },
              { name: "Role", value: "role" },
              { name: "Channel", value: "channel" },
              { name: "Bot", value: "bot" },
            ),
        )
        .addStringOption((opt) =>
          opt
            .setName("module")
            .setDescription("Target module to whitelist from")
            .setRequired(true)
            .addChoices(
              { name: "All Modules (Universal)", value: "all" },
              { name: "Anti-Spam", value: "spam" },
              { name: "Anti-Links", value: "links" },
              { name: "Anti-Invites", value: "invites" },
              { name: "Anti-Mentions", value: "mentions" },
              { name: "AutoMod General", value: "automod" },
              { name: "Anti-Nuke", value: "antinuke" },
              { name: "Anti-Raid", value: "antiraid" },
            ),
        )
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for whitelist")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove target from a module whitelist")
        .addStringOption((opt) => opt.setName("target_id").setDescription("User, Role, or Channel ID").setRequired(true))
        .addStringOption((opt) => opt.setName("module").setDescription("Module (default: all)")),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all module-scoped whitelists for this server"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const targetId = interaction.options.getString("target_id", true);
      const targetType = interaction.options.getString("type", true) as any;
      const module = interaction.options.getString("module", true) as any;
      const reason = interaction.options.getString("reason") || "No reason provided.";

      await whitelistService.addWhitelist({
        guildId: interaction.guild.id,
        targetId,
        targetType,
        module,
        reason,
        createdBy: interaction.user.id,
      });

      await interaction.reply({
        content: `✅ **Whitelisted <@${targetId}> for module \`${module}\`!**\nReason: *"${reason}"*`,
      });
    } else if (sub === "remove") {
      const targetId = interaction.options.getString("target_id", true);
      const module = interaction.options.getString("module") || "all";

      const removed = await whitelistService.removeWhitelist(interaction.guild.id, targetId, module);
      await interaction.reply({
        content: removed
          ? `🗑️ Removed whitelist for \`${targetId}\` from \`${module}\`.`
          : `❌ Whitelist record not found.`,
      });
    } else if (sub === "list") {
      const list = await whitelistService.getWhitelists(interaction.guild.id);

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`🛡️ Active Whitelists • ${interaction.guild.name}`)
        .setDescription(
          list.length === 0
            ? "*No active whitelists configured.*"
            : list
                .map(
                  (w, i) =>
                    `**${i + 1}.** Target: \`${w.targetId}\` (${w.targetType}) ➜ Module: \`${w.module}\`\nReason: *"${w.reason}"*`,
                )
                .join("\n\n"),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "list") {
      const list = await whitelistService.getWhitelists(message.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("🛡️ Whitelists")
        .setDescription(
          list.length === 0 ? "*None.*" : list.map((w) => `• \`${w.targetId}\` (${w.targetType}) ➜ \`${w.module}\``).join("\n"),
        );
      await message.reply({ embeds: [embed] });
    } else {
      await message.reply({
        content: "🛡️ **Whitelist:**\n• `>whitelist list`\n• Use `/whitelist add` for full module-scoped whitelist grants.",
      });
    }
  },
};
