import {
  type ChatInputCommandInteraction,
  type Message,
  type EmbedBuilder,
  type ActionRowBuilder,
  type ButtonBuilder,
  type StringSelectMenuBuilder,
  ComponentType,
} from "discord.js";
import { createPaginationButtons } from "./components.js";

export interface PaginationPage {
  embed: EmbedBuilder;
  categoryId?: string;
}

export interface PaginationOptions {
  pages: PaginationPage[];
  selectMenu?: ActionRowBuilder<StringSelectMenuBuilder>;
  timeoutMs?: number;
  initialIndex?: number;
}

export async function sendPaginatedMenu(
  context: ChatInputCommandInteraction | Message,
  options: PaginationOptions,
): Promise<void> {
  const { pages, selectMenu, timeoutMs = 120000, initialIndex = 0 } = options;
  if (pages.length === 0) return;

  let currentIndex = Math.max(0, Math.min(initialIndex, pages.length - 1));

  const buildRows = (idx: number) => {
    const rows: any[] = [];
    if (selectMenu) rows.push(selectMenu);
    if (pages.length > 1) {
      rows.push(createPaginationButtons(idx, pages.length, "pag"));
    }
    return rows;
  };

  const initialEmbed = pages[currentIndex]!.embed;
  const initialRows = buildRows(currentIndex);

  let replyMsg: Message;
  const targetUser = "user" in context ? context.user : context.author;

  if ("isChatInputCommand" in context && (context.isChatInputCommand?.() || "commandName" in context)) {
    const inter = context as ChatInputCommandInteraction;
    if (inter.deferred) {
      replyMsg = (await inter.editReply({ embeds: [initialEmbed], components: initialRows })) as Message;
    } else if (inter.replied) {
      replyMsg = (await inter.followUp({ embeds: [initialEmbed], components: initialRows })) as Message;
    } else {
      replyMsg = (await inter.reply({ embeds: [initialEmbed], components: initialRows, fetchReply: true })) as Message;
    }
  } else {
    replyMsg = await (context as Message).reply({ embeds: [initialEmbed], components: initialRows });
  }

  const collector = replyMsg.createMessageComponentCollector({
    time: timeoutMs,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== targetUser.id) {
      await i.reply({ content: "❌ Only the command author can control this menu.", ephemeral: true });
      return;
    }

    if (i.isButton()) {
      const customId = i.customId;
      if (customId === "pag_first") {
        currentIndex = 0;
      } else if (customId === "pag_prev") {
        currentIndex = Math.max(0, currentIndex - 1);
      } else if (customId === "pag_next") {
        currentIndex = Math.min(pages.length - 1, currentIndex + 1);
      } else if (customId === "pag_last") {
        currentIndex = pages.length - 1;
      } else if (customId === "pag_close") {
        collector.stop("closed_by_user");
        await i.deferUpdate();
        await replyMsg.delete().catch(() => {});
        return;
      }

      await i.update({
        embeds: [pages[currentIndex]!.embed],
        components: buildRows(currentIndex),
      });
    } else if (i.isStringSelectMenu()) {
      const selectedCat = i.values[0];
      const foundIdx = pages.findIndex((p) => p.categoryId === selectedCat);
      if (foundIdx !== -1) {
        currentIndex = foundIdx;
      }
      await i.update({
        embeds: [pages[currentIndex]!.embed],
        components: buildRows(currentIndex),
      });
    }
  });

  collector.on("end", async (_collected, reason) => {
    if (reason === "closed_by_user") return;
    // Disable all components on timeout
    const disabledRows = buildRows(currentIndex).map((row) => {
      row.components.forEach((c: any) => c.setDisabled(true));
      return row;
    });
    await replyMsg.edit({ components: disabledRows }).catch(() => {});
  });
}
