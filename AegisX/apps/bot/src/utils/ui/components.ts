import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";

export function createPaginationButtons(
  currentPage: number,
  maxPages: number,
  idPrefix = "page",
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${idPrefix}_first`)
      .setEmoji("⏪")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0),
    new ButtonBuilder()
      .setCustomId(`${idPrefix}_prev`)
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0),
    new ButtonBuilder()
      .setCustomId(`${idPrefix}_close`)
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`${idPrefix}_next`)
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= maxPages - 1),
    new ButtonBuilder()
      .setCustomId(`${idPrefix}_last`)
      .setEmoji("⏩")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= maxPages - 1),
  );
}

export function createLinkButton(label: string, url: string, emoji?: string): ButtonBuilder {
  const btn = new ButtonBuilder()
    .setLabel(label)
    .setStyle(ButtonStyle.Link)
    .setURL(url);
  if (emoji) btn.setEmoji(emoji);
  return btn;
}

export function createSelectMenu(
  customId: string,
  placeholder: string,
  options: Array<{ label: string; value: string; description?: string; emoji?: string }>,
): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(
      options.map((opt) => {
        const option = new StringSelectMenuOptionBuilder()
          .setLabel(opt.label)
          .setValue(opt.value);
        if (opt.description) option.setDescription(opt.description);
        if (opt.emoji) option.setEmoji(opt.emoji);
        return option;
      }),
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}
