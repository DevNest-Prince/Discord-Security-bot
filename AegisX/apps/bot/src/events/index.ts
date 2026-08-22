import type { Client } from "discord.js";

import { registerClientReadyEvent } from "./client-ready.js";
import { registerGuildCreateEvent } from "./guild-create.js";
import { handleGuildBanAdd } from "./guild-ban-add.js";
import { handleGuildBanRemove } from "./guild-ban-remove.js";
import { handleGuildMemberAdd } from "./guild-member-add.js";
import { handleGuildMemberRemove } from "./guild-member-remove.js";
import { handleGuildMemberUpdate } from "./guild-member-update.js";
import { handleChannelDelete } from "./channel-delete.js";
import { handleChannelCreate } from "./channel-create.js";
import { handleChannelUpdate } from "./channel-update.js";
import { handleRoleDelete } from "./role-delete.js";
import { handleRoleCreate } from "./role-create.js";
import { handleRoleUpdate } from "./role-update.js";
import { handleGuildUpdate } from "./guild-update.js";
import { handleMessageCreate } from "./message-create.js";
import { handleInteractionCreate } from "./interaction-create.js";
import {
  webhookAuditResolver,
} from "../security/webhook/webhook-audit-resolver.js";

export function registerEvents(
  client: Client,
): void {
  registerClientReadyEvent(client);
  registerGuildCreateEvent(client);

  // Bans
  client.on("guildBanAdd", (ban) => {
    void handleGuildBanAdd(ban.guild, ban.user.id);
  });

  client.on("guildBanRemove", (ban) => {
    void handleGuildBanRemove(ban.guild, ban.user.id);
  });

  // Members & Anti-Bot Add / Anti-Kick
  client.on("guildMemberAdd", (member) => {
    void handleGuildMemberAdd(member);
  });

  client.on("guildMemberRemove", (member) => {
    void handleGuildMemberRemove(member);
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    void handleGuildMemberUpdate(oldMember, newMember);
  });

  // Channels
  client.on("channelDelete", (channel) => {
    if (!channel.isDMBased()) {
      void handleChannelDelete(channel);
    }
  });

  client.on("channelCreate", (channel) => {
    if (!channel.isDMBased()) {
      void handleChannelCreate(channel);
    }
  });

  client.on("channelUpdate", (oldChannel, newChannel) => {
    void handleChannelUpdate(oldChannel, newChannel);
  });

  // Roles
  client.on("roleDelete", (role) => {
    void handleRoleDelete(role);
  });

  client.on("roleCreate", (role) => {
    void handleRoleCreate(role);
  });

  client.on("roleUpdate", (oldRole, newRole) => {
    void handleRoleUpdate(oldRole, newRole);
  });

  // Guild
  client.on("guildUpdate", (oldGuild, newGuild) => {
    void handleGuildUpdate(oldGuild, newGuild);
  });

  // Webhooks
  client.on("webhooksUpdate", (channel) => {
    if (!channel.isDMBased()) {
      void webhookAuditResolver.resolve(channel.guild);
    }
  });

  // Messages (AutoMod & Anti-Everyone)
  client.on("messageCreate", (message) => {
    void handleMessageCreate(message);
  });

  // Interactions (Slash Commands & Components)
  client.on("interactionCreate", (interaction) => {
    void handleInteractionCreate(interaction);
  });
}