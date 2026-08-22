import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type GuildMember,
  type Message,
} from "discord.js";
import {
  getStaffProfiles,
  upsertStaffProfile,
  deleteStaffProfile,
  type StaffPermissionProfile,
} from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export const staffCommand = {
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Configure internal bot staff permission profiles (No Administrator needed)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Assign bot staff profile & authority tier to a Discord role")
        .addRoleOption((opt) => opt.setName("role").setDescription("Target Discord role").setRequired(true))
        .addStringOption((opt) => opt.setName("name").setDescription("Staff Profile Name (e.g. Senior Admin)").setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName("priority").setDescription("Authority level (e.g. 100=Admin, 50=Mod, 10=Trial)").setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("commands")
            .setDescription("Comma-separated commands (e.g. ban,kick,mute,warn,jail,purge,lock)")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove bot staff rights from a role")
        .addRoleOption((opt) => opt.setName("role").setDescription("Discord role").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all internal bot staff permission profiles"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const role = interaction.options.getRole("role", true);
      const name = interaction.options.getString("name", true);
      const priority = interaction.options.getInteger("priority", true);
      const commandsRaw = interaction.options.getString("commands", true);
      const allowedCommands = commandsRaw.split(",").map((c) => c.trim().toLowerCase());

      await upsertStaffProfile(interaction.guild.id, role.id, {
        name,
        priority,
        allowedCommands,
        allowedModules: ["moderation"],
        canModerateLowerStaff: true,
      });

      await interaction.reply({
        content: `✅ **Configured Staff Profile \`${name}\` for <@&${role.id}>!**\n• Priority Rank: \`${priority}\`\n• Allowed Commands: \`${allowedCommands.join(", ")}\``,
      });
    } else if (sub === "remove") {
      const role = interaction.options.getRole("role", true);
      await deleteStaffProfile(interaction.guild.id, role.id);
      await interaction.reply({ content: `🗑️ Removed staff permissions from <@&${role.id}>.` });
    } else if (sub === "list") {
      const profiles = await getStaffProfiles(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`🛡️ Staff Permission Profiles • ${interaction.guild.name}`)
        .setDescription(
          profiles.length === 0
            ? "*No custom bot staff profiles created yet.*"
            : profiles
                .map(
                  (p) =>
                    `• **${p.name}** (<@&${p.roleId}>)\nPriority: \`${p.priority}\` | Commands: \`${p.allowedCommands.join(", ")}\``,
                )
                .join("\n\n"),
        )
        .setFooter({ text: "AegisX Central Role Security • Granular Bot Authority" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "list") {
      const profiles = await getStaffProfiles(message.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("🛡️ Bot Staff Profiles")
        .setDescription(
          profiles.length === 0
            ? "*None configured.*"
            : profiles.map((p) => `• **${p.name}** (<@&${p.roleId}>) ➜ Prio ${p.priority} [${p.allowedCommands.join(",")}]`).join("\n"),
        );
      await message.reply({ embeds: [embed] });
    } else {
      await message.reply({
        content: "🛡️ **Staff Commands:**\n• `>staff list`\n• Slash command `/staff add` for full interactive profile setup.",
      });
    }
  },
};
