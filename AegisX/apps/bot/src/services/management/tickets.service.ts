import {
  type ButtonInteraction,
  type StringSelectMenuInteraction,
  type TextChannel,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import {
  getGuildConfig,
  createTicketRecord,
  getTicketRecordByChannel,
  closeTicketRecord,
  claimTicketRecord,
  getUserOpenTicket,
} from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export function createTicketPanel(
  title: string,
  description: string,
  categories: Array<{ name: string; emoji?: string | null }>,
): {
  embed: EmbedBuilder;
  row: ActionRowBuilder<StringSelectMenuBuilder>;
} {
  const embed = new EmbedBuilder()
    .setColor(AegisColors.Primary)
    .setTitle(`🎫 ${title}`)
    .setDescription(description || "Select a category below to open a private support ticket with our team.")
    .setFooter({ text: "AegisX Support Desk" })
    .setTimestamp();

  const menu = new StringSelectMenuBuilder()
    .setCustomId("aegis_ticket_create_select")
    .setPlaceholder("📩 Choose Ticket Category...");

  if (categories.length === 0) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("General Support")
        .setValue("General Support")
        .setDescription("General inquiries and assistance")
        .setEmoji("💬"),
    );
  } else {
    categories.forEach((cat) => {
      const opt = new StringSelectMenuOptionBuilder()
        .setLabel(cat.name)
        .setValue(cat.name);
      if (cat.emoji) opt.setEmoji(cat.emoji);
      menu.addOptions(opt);
    });
  }

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
  return { embed, row };
}

export async function handleTicketCreateInteraction(
  interaction: StringSelectMenuInteraction,
): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  const guild = interaction.guild;
  const user = interaction.user;
  const categoryName = interaction.values[0] || "General Support";

  await interaction.deferReply({ ephemeral: true });

  const existingTicket = await getUserOpenTicket(guild.id, user.id);
  if (existingTicket) {
    const existingChan = guild.channels.cache.get(existingTicket.channelId);
    if (existingChan) {
      await interaction.editReply({
        content: `⚠️ You already have an open ticket in <#${existingTicket.channelId}>. Please use your existing ticket.`,
      });
      return;
    }
  }

  const config = await getGuildConfig(guild.id);
  const ticketConfig = config.tickets;

  const staffRoleIds = ticketConfig.staffRoles || [];
  const permissionOverwrites: any[] = [
    {
      id: guild.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks,
      ],
    },
    {
      id: guild.client.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageMessages,
      ],
    },
  ];

  staffRoleIds.forEach((rId) => {
    if (guild.roles.cache.has(rId)) {
      permissionOverwrites.push({
        id: rId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      });
    }
  });

  try {
    const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`.slice(0, 30);
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: ticketConfig.panelChannelId ? (guild.channels.cache.get(ticketConfig.panelChannelId)?.parentId || undefined) : undefined,
      permissionOverwrites,
    });

    await createTicketRecord({
      guildId: guild.id,
      channelId: ticketChannel.id,
      userId: user.id,
      category: categoryName,
      status: "open",
    });

    const ticketControls = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("aegis_ticket_close_btn")
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("aegis_ticket_claim_btn")
        .setLabel("Claim Ticket")
        .setEmoji("🙋‍♂️")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("aegis_ticket_transcript_btn")
        .setLabel("Save Transcript")
        .setEmoji("📜")
        .setStyle(ButtonStyle.Secondary),
    );

    const welcomeEmbed = new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle(`🎫 ${categoryName} Ticket`)
      .setDescription(
        `Hello <@${user.id}>! Thank you for reaching out.\n\n` +
        `Our support team has been notified and will assist you shortly.\n` +
        `*Please describe your issue or inquiry in detail.*`
      )
      .addFields(
        { name: "👤 Opened By", value: `<@${user.id}> (\`${user.id}\`)`, inline: true },
        { name: "🏷️ Category", value: `\`${categoryName}\``, inline: true },
      )
      .setFooter({ text: "Use buttons below to manage this ticket" })
      .setTimestamp();

    await ticketChannel.send({
      content: `<@${user.id}> ${staffRoleIds.map((r) => `<@&${r}>`).join(" ")}`,
      embeds: [welcomeEmbed],
      components: [ticketControls],
    });

    await interaction.editReply({
      content: `✅ Your ticket has been created! Head over to <#${ticketChannel.id}>.`,
    });
  } catch (err) {
    console.error(`[Tickets] Failed to create ticket channel in ${guild.id}:`, err);
    await interaction.editReply({
      content: "❌ Failed to create ticket channel. Please ensure the bot has `Manage Channels` permission.",
    });
  }
}

export async function handleTicketButtonInteraction(
  interaction: ButtonInteraction,
): Promise<void> {
  if (!interaction.guild || !interaction.channel || !interaction.channel.isTextBased()) return;

  const channel = interaction.channel as TextChannel;
  const customId = interaction.customId;

  if (customId === "aegis_ticket_close_btn") {
    await interaction.reply({ content: "🔒 Closing ticket in 5 seconds...", ephemeral: false });
    await closeTicketRecord(channel.id, interaction.user.id);
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch {}
    }, 5000);
  } else if (customId === "aegis_ticket_claim_btn") {
    await claimTicketRecord(channel.id, interaction.user.id);
    await interaction.reply({
      content: `🙋‍♂️ Ticket has been claimed by <@${interaction.user.id}>!`,
    });
  } else if (customId === "aegis_ticket_transcript_btn") {
    await interaction.deferReply();
    const messages = await channel.messages.fetch({ limit: 100 });
    const log = messages
      .reverse()
      .map((m) => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.cleanContent}`)
      .join("\n");

    const buffer = Buffer.from(log, "utf-8");
    await interaction.editReply({
      content: `📜 **Transcript for ${channel.name}:**`,
      files: [{ attachment: buffer, name: `${channel.name}-transcript.txt` }],
    });
  }
}
