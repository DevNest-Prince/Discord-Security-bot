import type { Interaction, GuildMember, VoiceChannel } from "discord.js";
import {
  helpCommand,
  setupCommand,
  securityCommand,
  antinukeCommand,
  raidCommand,
  autoEmergencyCommand,
  whitelistCommand,
  extraownerCommand,
  automodCommand,
  emergencyCommand,
  antibetrayCommand,
  limitCommand,
  banCommand,
  unbanCommand,
  kickCommand,
  muteCommand,
  unmuteCommand,
  lockCommand,
  unlockCommand,
  hideCommand,
  unhideCommand,
  nukeCommand,
  purgeCommand,
  vckickCommand,
  vcmuteCommand,
  vcunmuteCommand,
  moderationCommand,
  warnCommand,
  casesCommand,
  jailCommand,
  pingCommand,
  serverinfoCommand,
  botinfoCommand,
  infoCommand,
  staffCommand,
  autoroleCommand,
  welcomeCommand,
  goodbyeCommand,
  verificationCommand,
  vanityrolesCommand,
  ticketsCommand,
  levelingCommand,
  loggingCommand,
  customrolesCommand,
  j2cCommand,
  voiceCommand,
  vcBanCommand,
  giveawayCommand,
  autoreactCommand,
  autoResponderCommand,
  funCommand,
  ignoreCommand,
  joindmCommand,
  backupCommand,
} from "../commands/index.js";
import { handleVerificationInteraction } from "../services/management/verification.service.js";
import {
  handleTicketCreateInteraction,
  handleTicketButtonInteraction,
} from "../services/management/tickets.service.js";
import { tempVoiceMap } from "../services/management/voice.service.js";
import { addParticipant, getGiveawayByMessageId } from "@aegisx/database";

const commands = new Map<string, any>([
  [helpCommand.data.name, helpCommand],
  [setupCommand.data.name, setupCommand],
  [securityCommand.data.name, securityCommand],
  [antinukeCommand.data.name, antinukeCommand],
  [raidCommand.data.name, raidCommand],
  [autoEmergencyCommand.data.name, autoEmergencyCommand],
  [whitelistCommand.data.name, whitelistCommand],
  [extraownerCommand.data.name, extraownerCommand],
  [automodCommand.data.name, automodCommand],
  [emergencyCommand.data.name, emergencyCommand],
  [antibetrayCommand.data.name, antibetrayCommand],
  [limitCommand.data.name, limitCommand],
  [moderationCommand.data.name, moderationCommand],
  [warnCommand.data.name, warnCommand],
  [casesCommand.data.name, casesCommand],
  [jailCommand.data.name, jailCommand],
  [banCommand.data.name, banCommand],
  [unbanCommand.data.name, unbanCommand],
  [kickCommand.data.name, kickCommand],
  [muteCommand.data.name, muteCommand],
  [unmuteCommand.data.name, unmuteCommand],
  [lockCommand.data.name, lockCommand],
  [unlockCommand.data.name, unlockCommand],
  [hideCommand.data.name, hideCommand],
  [unhideCommand.data.name, unhideCommand],
  [nukeCommand.data.name, nukeCommand],
  [purgeCommand.data.name, purgeCommand],
  [vckickCommand.data.name, vckickCommand],
  [vcmuteCommand.data.name, vcmuteCommand],
  [vcunmuteCommand.data.name, vcunmuteCommand],
  [pingCommand.data.name, pingCommand],
  [serverinfoCommand.data.name, serverinfoCommand],
  [botinfoCommand.data.name, botinfoCommand],
  [infoCommand.data.name, infoCommand],
  [staffCommand.data.name, staffCommand],
  [autoroleCommand.data.name, autoroleCommand],
  [welcomeCommand.data.name, welcomeCommand],
  [goodbyeCommand.data.name, goodbyeCommand],
  [verificationCommand.data.name, verificationCommand],
  [vanityrolesCommand.data.name, vanityrolesCommand],
  [ticketsCommand.data.name, ticketsCommand],
  [levelingCommand.data.name, levelingCommand],
  [loggingCommand.data.name, loggingCommand],
  [customrolesCommand.data.name, customrolesCommand],
  [j2cCommand.data.name, j2cCommand],
  [voiceCommand.data.name, voiceCommand],
  [vcBanCommand.data.name, vcBanCommand],
  [giveawayCommand.data.name, giveawayCommand],
  [autoreactCommand.data.name, autoreactCommand],
  [autoResponderCommand.data.name, autoResponderCommand],
  [funCommand.data.name, funCommand],
  [ignoreCommand.data.name, ignoreCommand],
  [joindmCommand.data.name, joindmCommand],
  [backupCommand.data.name, backupCommand],
]);

export async function handleInteractionCreate(
  interaction: Interaction,
): Promise<void> {
  // 1. Handle Verification Button
  if (interaction.isButton() && interaction.customId === "aegis_verify_btn") {
    await handleVerificationInteraction(interaction);
    return;
  }

  // 2. Handle Ticket Select Menu
  if (interaction.isStringSelectMenu() && interaction.customId === "aegis_ticket_create_select") {
    await handleTicketCreateInteraction(interaction);
    return;
  }

  // 3. Handle Ticket Control Buttons
  if (interaction.isButton() && interaction.customId.startsWith("aegis_ticket_")) {
    await handleTicketButtonInteraction(interaction);
    return;
  }

  // 4. Handle Giveaway Entry Button
  if (interaction.isButton() && interaction.customId === "aegis_giveaway_enter") {
    const giveaway = await getGiveawayByMessageId(interaction.message.id);
    if (!giveaway || giveaway.ended) {
      await interaction.reply({ content: "❌ This giveaway has already ended.", ephemeral: true });
      return;
    }

    if (giveaway.participants.includes(interaction.user.id)) {
      await interaction.reply({ content: "⚠️ You have already entered this giveaway!", ephemeral: true });
      return;
    }

    await addParticipant(interaction.message.id, interaction.user.id);
    await interaction.reply({ content: "🎉 **You successfully entered the giveaway! Good luck!**", ephemeral: true });
    return;
  }

  // 5. Handle Voice Room Control Panel Buttons
  if (interaction.isButton() && interaction.customId.startsWith("aegis_vc_")) {
    const member = interaction.member as GuildMember;
    const vc = member?.voice.channel as VoiceChannel | null;
    if (!vc) {
      await interaction.reply({ content: "❌ You must be inside the voice room to use controls.", ephemeral: true });
      return;
    }

    const session = tempVoiceMap.get(vc.id);
    if (!session) {
      await interaction.reply({ content: "❌ Not an active temporary voice room.", ephemeral: true });
      return;
    }

    const customId = interaction.customId;
    if (customId === "aegis_vc_claim") {
      session.ownerId = member.id;
      tempVoiceMap.set(vc.id, session);
      await interaction.reply({ content: `👑 <@${member.id}> claimed ownership of this voice room!` });
      return;
    }

    if (session.ownerId !== member.id) {
      await interaction.reply({ content: "❌ Only the voice room owner can manage these settings.", ephemeral: true });
      return;
    }

    if (customId === "aegis_vc_lock") {
      await vc.permissionOverwrites.edit(interaction.guildId!, { Connect: false });
      await interaction.reply({ content: "🔒 **Voice room locked.**", ephemeral: true });
    } else if (customId === "aegis_vc_unlock") {
      await vc.permissionOverwrites.edit(interaction.guildId!, { Connect: true });
      await interaction.reply({ content: "🔓 **Voice room unlocked.**", ephemeral: true });
    } else if (customId === "aegis_vc_hide") {
      await vc.permissionOverwrites.edit(interaction.guildId!, { ViewChannel: false });
      await interaction.reply({ content: "👁️ **Voice room hidden.**", ephemeral: true });
    } else if (customId === "aegis_vc_unhide") {
      await vc.permissionOverwrites.edit(interaction.guildId!, { ViewChannel: true });
      await interaction.reply({ content: "👀 **Voice room unhidden.**", ephemeral: true });
    }
    return;
  }

  // 6. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error: any) {
      console.error(`❌ Error executing command ${interaction.commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  }
}
