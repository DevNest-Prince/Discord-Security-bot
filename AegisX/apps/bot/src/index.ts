import dotenv from "dotenv";
import path from "node:path";
import { Client, GatewayIntentBits } from "discord.js";
import {
  connectDatabase,
  getGuildConfig,
} from "@aegisx/database";



import { connectRedis } from "@aegisx/redis";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("DISCORD_TOKEN is missing from environment variables.");
}

async function startBot() {
  await connectDatabase();
  await connectRedis();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once("clientReady", (readyClient) => {
    console.log(`✅ ${readyClient.user.tag} is online!`);
  });

  client.on("guildCreate", async (guild) => {
    try {
      const config = await getGuildConfig(guild.id);

      console.log(
        `🛡️ Guild configured: ${guild.name} (${guild.id})`,
      );

      console.log(
        `⚙️ Anti-Nuke: ${config.security?.antiNuke?.enabled ?? false}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to configure guild ${guild.id}:`,
        error,
      );
    }
  });

  await client.login(token);
}

startBot().catch((error) => {
  console.error("❌ Failed to start AegisX:", error);
  process.exit(1);
});