import { Router } from "express";
import type { Client } from "discord.js";
import {
  getGuildConfig,
  updateGuildPrefix,
  updateAntiNukeConfig,
  setWhitelistedUser,
  removeWhitelistedUser,
  setExtraOwner,
  removeExtraOwner,
  updateAutomodConfig,
  updateLoggingConfig,
  updateAutoRoleConfig,
  updateVerificationConfig,
  setVanityRole,
  removeVanityRole,
  updateWelcomeConfig,
  deleteWelcomeConfig,
  updateTicketConfig,
  updateLevelingConfig,
} from "@aegisx/database";
import { deleteGuildConfigCache } from "@aegisx/redis";

export function createGuildsRoutes(client: Client): Router {
  const router = Router();

  // 1. List Guilds
  router.get("/", (req, res) => {
    const guilds = client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL() ?? null,
      member_count: guild.memberCount,
      bot_present: true,
    }));

    return res.json(guilds);
  });

  // 2. Guild Details
  router.get("/:guildId", async (req, res) => {
    const { guildId } = req.params;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      return res.status(404).json({ error: "Guild not found on bot instance" });
    }

    return res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL() ?? null,
      member_count: guild.memberCount,
      owner_id: guild.ownerId,
      channels_count: guild.channels.cache.size,
      roles_count: guild.roles.cache.size,
    });
  });

  // 3. Channels
  router.get("/:guildId/channels", (req, res) => {
    const { guildId } = req.params;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      return res.status(404).json({ error: "Guild not found" });
    }

    const channels = guild.channels.cache.map((ch) => ({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      position: "rawPosition" in ch ? ch.rawPosition : 0,
      parent_id: ch.parentId ?? null,
    }));

    return res.json(channels);
  });

  // 4. Roles
  router.get("/:guildId/roles", (req, res) => {
    const { guildId } = req.params;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      return res.status(404).json({ error: "Guild not found" });
    }

    const roles = guild.roles.cache.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.hexColor,
      position: r.position,
      permissions: r.permissions.bitfield.toString(),
      managed: r.managed,
    }));

    return res.json(roles);
  });

  // 5. Prefix
  router.get("/:guildId/prefix", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    return res.json({ prefix: config.prefix ?? ">" });
  });

  router.post("/:guildId/prefix", async (req, res) => {
    const { prefix } = req.body;
    if (!prefix || typeof prefix !== "string") {
      return res.status(400).json({ error: "Invalid prefix" });
    }

    await updateGuildPrefix(req.params.guildId, prefix);
    await deleteGuildConfigCache(req.params.guildId);
    return res.json({ prefix, success: true });
  });

  // 6. Anti-Nuke
  router.get("/:guildId/antinuke", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    const antiNuke = config.security?.antiNuke;

    return res.json({
      status: antiNuke?.enabled ?? false,
      whitelisted_users: Object.keys(config.security?.whitelistedUsers ?? {}),
      whitelisted_permissions: config.security?.whitelistedUsers ?? {},
      punishment: antiNuke?.action ?? "ban",
      extra_owners: config.security?.extraOwners ?? [],
      recovery_enabled: antiNuke?.recoveryEnabled !== false,
      log_channel_id: antiNuke?.logChannelId ?? null,
    });
  });

  router.patch("/:guildId/antinuke", async (req, res) => {
    const { guildId } = req.params;
    const {
      status,
      add_whitelist,
      remove_whitelist,
      add_extra_owner,
      remove_extra_owner,
      punishment,
    } = req.body;

    if (typeof status === "boolean") {
      await updateAntiNukeConfig(guildId, { enabled: status });
    }

    if (punishment && ["ban", "kick", "strip_roles"].includes(punishment)) {
      await updateAntiNukeConfig(guildId, { action: punishment });
    }

    if (add_whitelist) {
      await setWhitelistedUser(guildId, add_whitelist, {
        ban: true,
        kick: true,
        prune: true,
        botadd: true,
        serverup: true,
        memup: true,
        chcr: true,
        chdl: true,
        chup: true,
        rlcr: true,
        rlup: true,
        rldl: true,
        meneve: true,
        mngweb: true,
        mngstemo: true,
      });
    }

    if (remove_whitelist) {
      await removeWhitelistedUser(guildId, remove_whitelist);
    }

    if (add_extra_owner) {
      await setExtraOwner(guildId, add_extra_owner);
    }

    if (remove_extra_owner) {
      await removeExtraOwner(guildId, remove_extra_owner);
    }

    await deleteGuildConfigCache(guildId);
    return res.json({ success: true, message: "Anti-Nuke settings updated successfully" });
  });

  // 7. AutoMod
  router.get("/:guildId/automod", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    const automod = config.automod;

    return res.json({
      enabled: automod?.enabled ?? false,
      punishments: automod?.punishments ?? {},
      ignored_roles: automod?.ignoredRoles ?? [],
      ignored_channels: automod?.ignoredChannels ?? [],
      ignored_users: automod?.ignoredUsers ?? [],
      logging_channel: automod?.loggingChannel ?? null,
    });
  });

  router.patch("/:guildId/automod", async (req, res) => {
    const { guildId } = req.params;
    const {
      enabled,
      punishments,
      ignored_roles,
      ignored_channels,
      ignored_users,
      logging_channel,
    } = req.body;

    await updateAutomodConfig(guildId, {
      ...(typeof enabled === "boolean" && { enabled }),
      ...(punishments && { punishments }),
      ...(ignored_roles && { ignoredRoles: ignored_roles }),
      ...(ignored_channels && { ignoredChannels: ignored_channels }),
      ...(ignored_users && { ignoredUsers: ignored_users }),
      ...(logging_channel !== undefined && { loggingChannel: logging_channel }),
    });

    await deleteGuildConfigCache(guildId);
    return res.json({ success: true, message: "AutoMod settings updated successfully" });
  });

  // 8. Logging
  router.get("/:guildId/logging", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    return res.json(config.logging ?? {});
  });

  router.patch("/:guildId/logging", async (req, res) => {
    await updateLoggingConfig(req.params.guildId, req.body);
    await deleteGuildConfigCache(req.params.guildId);
    return res.json({ success: true });
  });

  // 9. AutoRole
  router.get("/:guildId/autorole", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    return res.json(config.autorole ?? {});
  });

  router.patch("/:guildId/autorole", async (req, res) => {
    await updateAutoRoleConfig(req.params.guildId, req.body);
    await deleteGuildConfigCache(req.params.guildId);
    return res.json({ success: true });
  });

  // 10. Verification
  router.get("/:guildId/verification", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    return res.json(config.verification ?? {});
  });

  router.patch("/:guildId/verification", async (req, res) => {
    await updateVerificationConfig(req.params.guildId, req.body);
    await deleteGuildConfigCache(req.params.guildId);
    return res.json({ success: true });
  });

  // 11. Vanity Roles
  router.get("/:guildId/vanityroles", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    return res.json(config.vanityRoles ?? []);
  });

  router.post("/:guildId/vanityroles", async (req, res) => {
    const { string, roleId, vanity } = req.body;
    await setVanityRole(req.params.guildId, { vanity: vanity || string, roleId });
    await deleteGuildConfigCache(req.params.guildId);
    return res.json({ success: true });
  });


  router.delete("/:guildId/vanityroles/:string", async (req, res) => {
    await removeVanityRole(req.params.guildId, req.params.string);
    await deleteGuildConfigCache(req.params.guildId);
    return res.json({ success: true });
  });

  // 12. Welcome
  router.get("/:guildId/welcome", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    return res.json(config.welcome ?? {});
  });

  router.patch("/:guildId/welcome", async (req, res) => {
    await updateWelcomeConfig(req.params.guildId, req.body);
    await deleteGuildConfigCache(req.params.guildId);
    return res.json({ success: true });
  });

  // 13. Tickets
  router.get("/:guildId/tickets", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    return res.json(config.tickets ?? {});
  });

  router.patch("/:guildId/tickets", async (req, res) => {
    await updateTicketConfig(req.params.guildId, req.body);
    await deleteGuildConfigCache(req.params.guildId);
    return res.json({ success: true });
  });

  // 14. Leveling
  router.get("/:guildId/leveling", async (req, res) => {
    const config = await getGuildConfig(req.params.guildId);
    return res.json(config.leveling ?? {});
  });

  router.patch("/:guildId/leveling", async (req, res) => {
    await updateLevelingConfig(req.params.guildId, req.body);
    await deleteGuildConfigCache(req.params.guildId);
    return res.json({ success: true });
  });

  return router;
}
