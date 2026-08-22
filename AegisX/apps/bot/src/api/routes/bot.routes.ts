import { Router } from "express";
import type { Client } from "discord.js";

export function createBotRoutes(client: Client): Router {
  const router = Router();

  router.get("/status", (req, res) => {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

    return res.json({
      status: client.isReady() ? "online" : "connecting",
      guilds_count: client.guilds.cache.size,
      users_count: totalUsers,
      ping_ms: Math.round(client.ws.ping),
      uptime_seconds: uptimeSeconds,
      shard_count: client.shard?.count ?? 1,
      memory_mb: Math.round(memory.heapUsed / 1024 / 1024),
    });
  });

  router.get("/info", (req, res) => {
    const user = client.user;
    if (!user) {
      return res.status(503).json({ error: "Bot is not ready yet" });
    }

    const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

    return res.json({
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar_url: user.displayAvatarURL(),
      guilds_count: client.guilds.cache.size,
      users_count: totalUsers,
      ping_ms: Math.round(client.ws.ping),
      uptime_seconds: Math.floor(process.uptime()),
    });
  });

  return router;
}
