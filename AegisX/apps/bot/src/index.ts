import dotenv from "dotenv";
import path from "node:path";
import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";

import { connectDatabase } from "@aegisx/database";
import { connectRedis } from "@aegisx/redis";

import { registerEvents } from "./events/index.js";
import { startApiServer } from "./api/server.js";
import { registerSlashCommands } from "./commands/register.js";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error(
    "DISCORD_TOKEN is missing from environment variables.",
  );
}

async function startBot(): Promise<void> {
  console.log("🛡️ Initializing AegisX Security Engine...");

  // 1. Connect MongoDB & Redis
  await connectDatabase();
  await connectRedis();

  // 2. Instantiate Discord Client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildBans,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildWebhooks,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.GuildMember,
      Partials.User,
    ],
  });

  // 3. Register Event Listeners
  registerEvents(client);

  // 4. Start Dashboard REST API Server
  const apiPort = Number(process.env.API_PORT) || 8000;
  startApiServer(client, apiPort);

  // 5. Discord Login
  const botToken = process.env.DISCORD_TOKEN;
  if (!botToken) {
    throw new Error("DISCORD_TOKEN is missing from environment variables.");
  }
  await client.login(botToken);

  // 6. Register Slash Commands
  const resolvedClientId = process.env.CLIENT_ID || client.user?.id;
  if (resolvedClientId && typeof resolvedClientId === "string") {
    const testGuildId = process.env.TEST_GUILD_ID;
    void registerSlashCommands(botToken, resolvedClientId, testGuildId);
  }
}




startBot().catch((error: unknown) => {
  console.error("❌ Failed to start AegisX:", error);
  process.exit(1);
});