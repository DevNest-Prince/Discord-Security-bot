import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type GuildMember,
  type Message,
} from "discord.js";
import { caseService } from "../../services/moderation/case.service.js";
import { permissionGuard } from "../../services/permissions/permission-guard.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const casesCommand = {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("View or manage moderation cases")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("Lookup a moderation case by Case ID")
        .addIntegerOption((opt) => opt.setName("case_id").setDescription("Case ID number").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("history")
        .setDescription("View moderation history for a specific user")
        .addUserOption((opt) => opt.setName("target").setDescription("User to inspect").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("reason")
        .setDescription("Update the reason for an existing case")
        .addIntegerOption((opt) => opt.setName("case_id").setDescription("Case ID").setRequired(true))
        .addStringOption((opt) => opt.setName("new_reason").setDescription("Updated reason").setRequired(true)),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const sub = interaction.options.getSubcommand();
    const moderator = interaction.member as GuildMember;

    const perm = await permissionGuard.canExecute(moderator, {
      module: "moderation",
      command: "case",
      discordFallback: PermissionFlagsBits.ModerateMembers,
    });

    if (!perm.allowed) {
      await interaction.reply({ content: `❌ **Access Denied:** ${perm.reason}`, ephemeral: true });
      return;
    }

    if (sub === "view") {
      const caseId = interaction.options.getInteger("case_id", true);
      const modCase = await caseService.getCase(interaction.guild.id, caseId);

      if (!modCase) {
        await interaction.reply({ content: `❌ Case \`#${caseId}\` not found in this server.`, ephemeral: true });
        return;
      }

      const embed = caseService.buildCaseEmbed(modCase, interaction.guild.name);
      await interaction.reply({ embeds: [embed] });
    } else if (sub === "history") {
      const targetUser = interaction.options.getUser("target", true);
      const history = await caseService.getUserHistory(interaction.guild.id, targetUser.id, 10);

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`📜 Moderation History • ${targetUser.tag}`)
        .setDescription(
          history.length === 0
            ? "*Clean record. No moderation cases found.*"
            : history
                .map(
                  (c) =>
                    `• **Case #${c.caseId} [${c.action.toUpperCase()}]** — *"${c.reason}"*\nMod: <@${c.moderatorId}> | Date: <t:${Math.floor(c.createdAt.getTime() / 1000)}:R>`,
                )
                .join("\n\n"),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "reason") {
      const caseId = interaction.options.getInteger("case_id", true);
      const newReason = interaction.options.getString("new_reason", true);

      const updated = await caseService.updateReason(
        interaction.guild.id,
        caseId,
        newReason,
        moderator.id,
      );

      if (!updated) {
        await interaction.reply({ content: `❌ Case \`#${caseId}\` not found.`, ephemeral: true });
        return;
      }

      await interaction.reply({
        content: `✅ Updated reason for **Case #${caseId}** to: *"${newReason}"*`,
      });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "history") {
      const target = message.mentions.users.first() || (args[1] ? await message.client.users.fetch(args[1]).catch(() => null) : null);
      if (!target) {
        await message.reply({ content: "❌ **Usage:** `>case history <@user>`" });
        return;
      }
      const history = await caseService.getUserHistory(message.guild.id, target.id, 10);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`📜 Mod History • ${target.tag}`)
        .setDescription(
          history.length === 0
            ? "*Clean record. No cases found.*"
            : history.map((c) => `• **Case #${c.caseId} [${c.action.toUpperCase()}]** — "${c.reason}"`).join("\n"),
        );
      await message.reply({ embeds: [embed] });
    } else {
      const caseId = parseInt(args[0] || "0", 10);
      if (isNaN(caseId) || caseId <= 0) {
        await message.reply({ content: "❌ **Usage:** `>case <case_id>` or `>case history <@user>`" });
        return;
      }

      const modCase = await caseService.getCase(message.guild.id, caseId);
      if (!modCase) {
        await message.reply({ content: `❌ Case #${caseId} not found.` });
        return;
      }
      const embed = caseService.buildCaseEmbed(modCase, message.guild.name);
      await message.reply({ embeds: [embed] });
    }
  },
};
