import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type Message,
} from "discord.js";
import { ignoreService } from "../../services/management/ignore.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const ignoreCommand = {
  data: new SlashCommandBuilder()
    .setName("ignore")
    .setDescription("Configure module ignore & exemption rules for channels, roles, and users")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add an ignore rule")
        .addStringOption((opt) => opt.setName("target_id").setDescription("Channel, Role, or User ID").setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Target entity type")
            .setRequired(true)
            .addChoices(
              { name: "Channel", value: "channel" },
              { name: "Role", value: "role" },
              { name: "User", value: "user" },
            ),
        )
        .addStringOption((opt) =>
          opt
            .setName("scope")
            .setDescription("Module scope to ignore")
            .setRequired(true)
            .addChoices(
              { name: "All Bot Features", value: "all" },
              { name: "Commands", value: "commands" },
              { name: "AutoMod Content Filters", value: "automod" },
              { name: "Audit Logging", value: "logging" },
            ),
        )
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for exemption")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove an ignore rule")
        .addStringOption((opt) => opt.setName("target_id").setDescription("Target ID").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all active ignore & bypass rules"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const targetId = interaction.options.getString("target_id", true);
      const targetType = interaction.options.getString("type", true) as any;
      const scope = interaction.options.getString("scope", true) as any;
      const reason = interaction.options.getString("reason") || "No reason provided.";

      const success = await ignoreService.addIgnoreRule(interaction.guild.id, {
        targetId,
        targetType,
        scope,
        reason,
      });

      await interaction.reply({
        content: success
          ? `✅ **Exempted \`${targetId}\` (${targetType}) for scope \`${scope}\`!**`
          : `⚠️ This target is already ignored for this scope.`,
      });
    } else if (sub === "remove") {
      const targetId = interaction.options.getString("target_id", true);
      const removed = await ignoreService.removeIgnoreRule(interaction.guild.id, targetId);
      await interaction.reply({
        content: removed ? `🗑️ Removed ignore rule for \`${targetId}\`.` : `❌ Rule not found.`,
      });
    } else if (sub === "list") {
      const rules = await ignoreService.getRules(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`👁️‍🗨️ Ignore & Bypass Rules • ${interaction.guild.name}`)
        .setDescription(
          rules.length === 0
            ? "*No ignore rules configured.*"
            : rules
                .map(
                  (r, i) =>
                    `**${i + 1}.** Target: \`${r.targetId}\` (${r.targetType})\n• Scope: \`${r.scope}\` | Reason: *"${r.reason}"*`,
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
      const rules = await ignoreService.getRules(message.guild.id);
      await message.reply({
        content: rules.length === 0 ? "ℹ️ No ignore rules." : `👁️‍🗨️ **Ignore Rules (${rules.length}):**\n${rules.map((r) => `• \`${r.targetId}\` ➜ \`${r.scope}\``).join("\n")}`,
      });
    } else {
      await message.reply({
        content: "👁️‍🗨️ **Ignore Commands:**\n• `>ignore list`\n• Use `/ignore add` for full interactive setup.",
      });
    }
  },
};
