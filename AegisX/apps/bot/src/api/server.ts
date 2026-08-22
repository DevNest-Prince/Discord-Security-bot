import express from "express";
import cors from "cors";
import type { Client } from "discord.js";
import { createBotRoutes } from "./routes/bot.routes.js";
import { createGuildsRoutes } from "./routes/guilds.routes.js";
import { createAdminRoutes } from "./routes/admin.routes.js";

export function startApiServer(client: Client, port: number = 8000) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`🌐 [API] ${req.method} ${req.url}`);
    next();
  });

  // Health check endpoint (no auth needed)
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth Middleware
  const apiKey = process.env.DASHBOARD_API_KEY || process.env.NEXT_PUBLIC_DASHBOARD_API_KEY;
  app.use("/api/v1", (req, res, next) => {
    if (!apiKey) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);
    if (token !== apiKey) {
      return res.status(403).json({ error: "Forbidden: Invalid API token" });
    }

    next();
  });

  // Mount API v1 Routes
  app.use("/api/v1/bot", createBotRoutes(client));
  app.use("/api/v1/guilds", createGuildsRoutes(client));
  app.use("/api/v1/admin", createAdminRoutes());

  const server = app.listen(port, () => {
    console.log(`🚀 [API] AegisX Dashboard REST API listening on port ${port} (http://localhost:${port}/api/v1)`);
  });

  return server;
}
