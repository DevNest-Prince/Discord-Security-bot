import { REST, Routes } from "discord.js";
import {
  helpCommand,
  antinukeCommand,
  whitelistCommand,
  securityCommand,
  raidCommand,
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
  autoreactCommand,
  joindmCommand,
  backupCommand,
  staffCommand,
  setupCommand,
} from "./index.js";

export async function registerSlashCommands(
  token: string,
  clientId: string,
  guildId?: string,
): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  const commandData = [
    helpCommand.data.toJSON(),
    setupCommand.data.toJSON(),
    securityCommand.data.toJSON(),
    antinukeCommand.data.toJSON(),
    raidCommand.data.toJSON(),
    whitelistCommand.data.toJSON(),
    extraownerCommand.data.toJSON(),
    automodCommand.data.toJSON(),
    emergencyCommand.data.toJSON(),
    antibetrayCommand.data.toJSON(),
    limitCommand.data.toJSON(),
    moderationCommand.data.toJSON(),
    warnCommand.data.toJSON(),
    casesCommand.data.toJSON(),
    jailCommand.data.toJSON(),
    banCommand.data.toJSON(),
    unbanCommand.data.toJSON(),
    kickCommand.data.toJSON(),
    muteCommand.data.toJSON(),
    unmuteCommand.data.toJSON(),
    lockCommand.data.toJSON(),
    unlockCommand.data.toJSON(),
    hideCommand.data.toJSON(),
    unhideCommand.data.toJSON(),
    nukeCommand.data.toJSON(),
    purgeCommand.data.toJSON(),
    vckickCommand.data.toJSON(),
    vcmuteCommand.data.toJSON(),
    vcunmuteCommand.data.toJSON(),
    pingCommand.data.toJSON(),
    serverinfoCommand.data.toJSON(),
    botinfoCommand.data.toJSON(),
    staffCommand.data.toJSON(),
    autoroleCommand.data.toJSON(),
    welcomeCommand.data.toJSON(),
    goodbyeCommand.data.toJSON(),
    verificationCommand.data.toJSON(),
    vanityrolesCommand.data.toJSON(),
    ticketsCommand.data.toJSON(),
    levelingCommand.data.toJSON(),
    loggingCommand.data.toJSON(),
    customrolesCommand.data.toJSON(),
    j2cCommand.data.toJSON(),
    voiceCommand.data.toJSON(),
    autoreactCommand.data.toJSON(),
    joindmCommand.data.toJSON(),
    backupCommand.data.toJSON(),
  ];

  try {
    console.log(`⏳ Registering ${commandData.length} application (/) commands...`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandData,
      });
      console.log(`✅ Successfully registered application commands for guild ${guildId}!`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData,
      });
      console.log(`✅ Successfully registered global application commands!`);
    }
  } catch (error: any) {
    console.error("❌ Failed to register slash commands:", error?.message ?? error);
  }
}
