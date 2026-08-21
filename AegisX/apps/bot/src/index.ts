import dotenv from "dotenv";
import path from "node:path";
import {
  Client,
  GatewayIntentBits,
} from "discord.js";

import { connectDatabase } from "@aegisx/database";
import { connectRedis } from "@aegisx/redis";

import { registerEvents } from "./events/index.js";

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
  await connectDatabase();
  await connectRedis();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
    ],
  });

  registerEvents(client);

  await client.login(token);
}

startBot().catch((error: unknown) => {
  console.error("❌ Failed to start AegisX:", error);
  process.exit(1);
});