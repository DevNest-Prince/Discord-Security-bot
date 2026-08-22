import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type Message,
} from "discord.js";
import { autoResponderService } from "../../services/automation/autoresponder.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const autoResponderCommand = {
  data: new SlashCommandBuilder()
    .setName("autoresponder")
    .setDescription("Custom automated message response triggers")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new automated response")
        .addStringOption((opt) => opt.setName("trigger").setDescription("Trigger keyword/phrase").setRequired(true))
        .addStringOption((opt) => opt.setName("response").setDescription("Bot reply content").setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName("match_type")
            .setDescription("Match strategy")
            .addChoices(
              { name: "Exact Match", value: "exact" },
              { name: "Contains Word", value: "contains" },
              { name: "Starts With", value: "startswith" },
              { name: "Ends With", value: "endswith" },
            ),
        )
        .addIntegerOption((opt) => opt.setName("cooldown").setDescription("Cooldown in seconds (default: 3)")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete an existing automated response trigger")
        .addStringOption((opt) => opt.setName("trigger").setDescription("Trigger keyword").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all active autoresponders for this server"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      const trigger = interaction.options.getString("trigger", true);
      const response = interaction.options.getString("response", true);
      const matchType = (interaction.options.getString("match_type") || "exact") as any;
      const cooldown = interaction.options.getInteger("cooldown") || 3;

      await autoResponderService.addRule(interaction.guild.id, trigger, response, matchType, cooldown);
      await interaction.reply({
        content: `✅ **AutoResponder created!**\n• Trigger: \`${trigger}\`\n• Match: \`${matchType}\`\n• Reply: >>> ${response}`,
      });
    } else if (sub === "delete") {
      const trigger = interaction.options.getString("trigger", true);
      const deleted = await autoResponderService.removeRule(interaction.guild.id, trigger);
      await interaction.reply({
        content: deleted ? `🗑️ AutoResponder for \`${trigger}\` deleted.` : "❌ Trigger not found.",
      });
    } else if (sub === "list") {
      const rules = await autoResponderService.getRules(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`⚙️ AutoResponders • ${interaction.guild.name}`)
        .setDescription(
          rules.length === 0
            ? "*No active autoresponders.*"
            : rules
                .map(
                  (r, i) =>
                    `**${i + 1}.** Trigger: \`${r.trigger}\` (${r.matchType})\nReply: *"${r.response}"*`,
                )
                .join("\n\n"),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "add" || sub === "create") {
      const trigger = args[1];
      const response = args.slice(2).join(" ");
      if (!trigger || !response) {
        await message.reply({ content: "❌ **Usage:** `>autoresponder create <trigger> <response>`" });
        return;
      }
      await autoResponderService.addRule(message.guild.id, trigger, response, "contains");
      await message.reply({ content: `✅ Created AutoResponder for \`${trigger}\`!` });
    } else if (sub === "list") {
      const rules = await autoResponderService.getRules(message.guild.id);
      await message.reply({
        content: rules.length === 0 ? "ℹ️ No autoresponders." : `⚙️ **AutoResponders (${rules.length}):**\n${rules.map((r) => `• \`${r.trigger}\` ➜ "${r.response}"`).join("\n")}`,
      });
    } else {
      await message.reply({
        content: "⚙️ **AutoResponder Commands:**\n• `>autoresponder create <trigger> <response>`\n• `>autoresponder list`",
      });
    }
  },
};
