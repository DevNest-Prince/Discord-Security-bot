import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Message,
} from "discord.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Universal Interactive Server Setup Wizard")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;

    const embed = new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle(`⚙️ AegisX Server Configuration Wizard • ${interaction.guild.name}`)
      .setDescription(
        `Welcome to the **AegisX Setup Center**! You can quickly configure the core enterprise engines for your server below:\n\n` +
        `**Available Setup Modules:**\n` +
        `• 🛡️ **Anti-Nuke & Defense:** \`/antinuke enable\` & \`/security status\`\n` +
        `• 🚨 **AutoMod System:** \`/automod enable\`\n` +
        `• 🔒 **Jail Quarantine:** \`/jail setup\`\n` +
        `• 🔊 **Join-to-Create Voice:** \`/voice setup\`\n` +
        `• 🎫 **Support Tickets:** \`/ticket panel\`\n` +
        `• 📜 **Audit Logging:** \`/logging all <#channel>\`\n` +
        `• 🎭 **AutoRole:** \`/autorole humans add <@role>\`\n` +
        `• 👋 **Welcome Greetings:** \`/welcome channel <#channel>\`\n` +
        `• 🛡️ **Staff Permissions:** \`/staff add\`\n\n` +
        `*Click the buttons below to open our web dashboard or support server.*`,
      )
      .setFooter({ text: "AegisX All-in-One Engine • Production Standard" })
      .setTimestamp();

    const btnDashboard = new ButtonBuilder()
      .setLabel("Web Dashboard")
      .setURL("http://localhost:3000")
      .setStyle(ButtonStyle.Link);

    const btnSupport = new ButtonBuilder()
      .setLabel("Support Server")
      .setURL("https://discord.gg/")
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btnDashboard, btnSupport);

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  async executePrefix(message: Message): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    await message.reply({
      content:
        `⚙️ **AegisX Quick Setup Guide:**\n` +
        `• \`>antinuke enable\` — 24/7 Server Defense\n` +
        `• \`>jail setup\` — Auto-provision quarantine cell\n` +
        `• \`>voice setup\` — Dynamic Temp VCs\n` +
        `• \`>logging all <#channel>\` — Universal Audit Logs\n` +
        `• \`>welcome channel <#channel>\` — Welcome Greetings\n` +
        `• \`>autorole humans add <@role>\` — Auto join role`,
    });
  },
};
