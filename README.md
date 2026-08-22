# 🛡️ AegisX — Enterprise Discord Security & AutoMod Bot

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2.svg?logo=discord)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x_LTS-green.svg?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D.svg?logo=redis)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**AegisX** is a high-performance, production-grade Discord Security, Anti-Nuke, AutoMod, and Management Bot built with **TypeScript**, **Discord.js v14**, **MongoDB (Mongoose)**, and **Redis**. It features instant event-driven punishments, automated recovery mechanisms (unbanning victims, recreating deleted channels/roles, kicking rogue bots), a granular whitelist hierarchy, and a dedicated **REST API** synchronized with Next.js web dashboards.

---

## ⚡ Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/DevNest-Prince/Discord-Security-bot.git
cd Discord-Security-bot/AegisX
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```
Fill in your `DISCORD_TOKEN`, `CLIENT_ID`, `MONGODB_URI`, `REDIS_URL`, and `DASHBOARD_API_KEY` in `.env`.

### 4. Build & Run
```bash
# Build all TypeScript packages & apps
npm run build

# Start bot in development mode
npm run dev:bot

# Or start in production mode
npm --workspace apps/bot run start
```

---

## 🛡️ Key Features

- **Anti-Nuke Protection**: Anti-Ban, Anti-Kick, Anti-Bot Add, Anti-Channel Delete/Create/Update, Anti-Role Delete/Create/Update, Anti-Member Update, Anti-Guild Update, Anti-Everyone/Here, Anti-Webhooks, Anti-Prune.
- **Auto-Recovery**: Unbans wrongfully banned members, kicks rogue bots, recreates deleted channels and roles with original permissions, and strips dangerous permissions.
- **AutoMod Engine**: Anti-Link, Anti-Invites (with server invite whitelist), Anti-Spam, Anti-Caps, Anti-Mass-Mention, Anti-Emoji-Spam with configurable punishments.
- **Dashboard REST API**: Express server running on port `8000` with Bearer auth for real-time Next.js dashboard synchronization.
- **Slash Commands**: `/antinuke`, `/whitelist`, `/extraowner`, `/automod`.

For full documentation, visit [AegisX/README.md](file:///C:/Users/princ/.gemini/antigravity/scratch/Discord-Security-bot/AegisX/README.md).
