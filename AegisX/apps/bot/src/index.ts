import dotenv from "dotenv";
import path from "node:path";
import { Client, GatewayIntentBits } from "discord.js";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("DISCORD_TOKEN is missing from environment variables.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("clientReady", (readyClient) => {
  console.log(`✅ ${readyClient.user.tag} is online!`);
});

client.login(token);