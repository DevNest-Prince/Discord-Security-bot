import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  type Message,
  type TextChannel,
} from "discord.js";
import { getGuildConfig, updateTicketConfig } from "@aegisx/database";
import { createTicketPanel } from "../../services/management/tickets.service.js";

export const ticketsCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Configure support ticket desk and panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Send an interactive ticket creation panel to a channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addRoleOption((opt) =>
          opt
            .setName("staff_role")
            .setDescription("Staff role to notify on new tickets")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a member to the current ticket channel")
        .addUserOption((opt) => opt.setName("user").setDescription("User to add").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a member from the current ticket channel")
        .addUserOption((opt) => opt.setName("user").setDescription("User to remove").setRequired(true)),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "panel") {
      const channel = interaction.options.getChannel("channel", true) as TextChannel;
      const staffRole = interaction.options.getRole("staff_role", true);

      await updateTicketConfig(interaction.guild.id, {
        panelChannelId: channel.id,
        staffRoles: [staffRole.id],
      });

      const { embed, row } = createTicketPanel(
        "AegisX Support Center",
        "Select a department below to create a private ticket with our team.",
        [
          { name: "General Support", emoji: "💬" },
          { name: "Billing & Subscriptions", emoji: "💳" },
          { name: "Report Malicious User / Raid", emoji: "🚨" },
        ],
      );

      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Ticket panel deployed to <#${channel.id}>!` });
    } else if (sub === "add") {
      const user = interaction.options.getUser("user", true);
      const chan = interaction.channel as TextChannel;
      if (!chan.name.startsWith("ticket-")) {
        await interaction.reply({ content: "❌ This command can only be used inside ticket channels.", ephemeral: true });
        return;
      }
      await chan.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });
      await interaction.reply({ content: `✅ Added <@${user.id}> to this ticket.` });
    } else if (sub === "remove") {
      const user = interaction.options.getUser("user", true);
      const chan = interaction.channel as TextChannel;
      if (!chan.name.startsWith("ticket-")) {
        await interaction.reply({ content: "❌ This command can only be used inside ticket channels.", ephemeral: true });
        return;
      }
      await chan.permissionOverwrites.delete(user.id);
      await interaction.reply({ content: `✅ Removed <@${user.id}> from this ticket.` });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "panel") {
      const channel = message.mentions.channels.first() || (args[1] ? message.guild.channels.cache.get(args[1]) : undefined) as TextChannel | undefined;
      const role = message.mentions.roles.first() || (args[2] ? message.guild.roles.cache.get(args[2]) : undefined);

      if (!channel || !role) {
        await message.reply({ content: "❌ **Usage:** `>ticket panel <#channel> <@staffRole>`" });
        return;
      }

      await updateTicketConfig(message.guild.id, {
        panelChannelId: channel.id,
        staffRoles: [role.id],
      });

      const { embed, row } = createTicketPanel(
        "AegisX Support Center",
        "Select a department below to create a private ticket with our team.",
        [
          { name: "General Support", emoji: "💬" },
          { name: "Billing & Subscriptions", emoji: "💳" },
          { name: "Report Malicious User / Raid", emoji: "🚨" },
        ],
      );

      await (channel as TextChannel).send({ embeds: [embed], components: [row] });
      await message.reply({ content: `✅ Ticket panel deployed to <#${channel.id}>!` });
    } else {
      await message.reply({
        content: "🎫 **Ticket Commands:**\n• `>ticket panel <#channel> <@staffRole>`\n• `>ticket add <@user>`\n• `>ticket remove <@user>`",
      });
    }
  },
};
