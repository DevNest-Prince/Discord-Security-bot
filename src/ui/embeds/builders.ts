import { EmbedBuilder } from 'discord.js';
import { Colors } from '../colors.js';
import { Icons } from '../icons.js';

export function createBaseEmbed() {
  return new EmbedBuilder().setTimestamp();
}

export function createSuccessEmbed(description: string) {
  return createBaseEmbed().setColor(Colors.SUCCESS).setDescription(`${Icons.SUCCESS} ${description}`);
}

export function createErrorEmbed(description: string) {
  return createBaseEmbed().setColor(Colors.ERROR).setDescription(`${Icons.ERROR} ${description}`);
}

export function createInfoEmbed(title: string, description: string) {
  return createBaseEmbed().setColor(Colors.INFO).setTitle(`${Icons.INFO} ${title}`).setDescription(description);
}