# 🛡️ AegisX — Enterprise Discord Security & AutoMod Bot

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2.svg?logo=discord)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x_LTS-green.svg?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D.svg?logo=redis)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**AegisX** is a high-performance, production-grade Discord Security, Anti-Nuke, AutoMod, and Management Bot built with **TypeScript**, **Discord.js v14**, **MongoDB (Mongoose)**, and **Redis**. It features instant event-driven punishments, automated recovery mechanisms (unbanning victims, recreating deleted channels/roles, kicking rogue bots), a granular whitelist hierarchy, and a dedicated **REST API** synchronized with Next.js web dashboards.

---

## ⚡ Features Overview

### 🛡️ 1. Anti-Nuke Defense Engine
- **Instant Live Enforcement**: Executes bans, kicks, role-stripping, or timeouts against malicious actors with automated rate-limit retry handling.
- **Automated Disaster Recovery**:
  - Automatically **unbans** wrongfully banned server members.
  - Instantly **kicks unauthorized bots** added without whitelist permission.
  - Automatically **recreates deleted channels** (restoring name, type, topic, position, and permission overwrites).
  - Automatically **recreates deleted roles** (restoring name, color, hoist, permissions, and position).
  - Instantly **strips dangerous permissions** (`Administrator`, `BanMembers`, `KickMembers`, `ManageGuild`, `ManageRoles`, `ManageChannels`, `ManageWebhooks`, `MentionEveryone`) added to lower roles or members.
  - Automatically **reverts unauthorized server modifications** (name, icon, vanity).

### 🤖 2. Comprehensive AutoMod Engine
- **Anti-Link**: Blocks unauthorized URLs, while automatically allowing Spotify tracks and Tenor/Giphy GIFs.
- **Anti-Invites**: Blocks external Discord server invites while dynamically allowing internal server invites.
- **Anti-Spam**: Sliding-window rate limiter detects and suppresses rapid message bursts (>5 messages / 10s).
- **Anti-Caps**: Flags excessive capitalization (>70% uppercase on messages with 45+ characters).
- **Anti-Mass-Mention**: Detects and punishes mass pings (>4 mentions or `@everyone`/`@here`).
- **Anti-Emoji-Spam**: Detects custom and Unicode emoji spam (>5 emojis).
- **Custom Punishments & Logging**: Configure actions (Mute/Timeout, Kick, Ban, Block) per rule, with auto-expiring in-channel notices and rich embed incident logs.

### 👑 3. Multi-Tier Permission Hierarchy
1. **Server Owner**: Permanently immune; holds absolute authority.
2. **Extra Owners**: Appointed trusted administrators who can configure Anti-Nuke, AutoMod, and whitelists.
3. **Granular Whitelist**: Assign per-module bypass permissions (`ban`, `kick`, `prune`, `botadd`, `serverup`, `memup`, `chcr`, `chdl`, `chup`, `rlcr`, `rlup`, `rldl`, `meneve`, `mngweb`).

### 🌐 4. Synchronized Next.js Dashboard REST API
- Runs an Express REST API on port `8000` (or configured `API_PORT`).
- Secured with Bearer Token authentication.
- Endpoints for real-time synchronization of Bot Stats, Guild Channels/Roles, Anti-Nuke, AutoMod, Logging, AutoRole, Verification, Vanity Roles, Tickets, and Leveling.

---

## 📋 Prerequisites

Before running AegisX, ensure you have the following installed on your machine or server:

- **Node.js**: `v20.x` or higher (LTS recommended) -> [Download Node.js](https://nodejs.org/)
- **npm**: `v9.x` or higher
- **MongoDB**: Local MongoDB instance or free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Redis**: Local Redis server or cloud Redis instance (e.g. [Upstash](https://upstash.com/))
- **Discord Bot Token**: From [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🚀 Step-by-Step Installation & Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/DevNest-Prince/Discord-Security-bot.git
cd Discord-Security-bot/AegisX
```

### Step 2: Install Dependencies
Install all workspace dependencies across the monorepo:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create your local `.env` configuration:
```bash
cp .env.example .env
```

Open `.env` in your editor and fill in your credentials:
```ini
# -------------------------------------------------------------
# AegisX Security Bot & Dashboard API Configuration
# -------------------------------------------------------------

# Discord Bot Credentials (from https://discord.com/developers/applications)
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
TEST_GUILD_ID=your_test_server_id_here          # Optional: Instant slash command sync

# Database Connection (MongoDB)
MONGODB_URI=mongodb://127.0.0.1:27017/aegisx   # or MongoDB Atlas URI
MONGODB_DB_NAME=aegisx

# Cache Connection (Redis)
REDIS_URL=redis://127.0.0.1:6379

# Dashboard REST API Server
API_PORT=8000
DASHBOARD_API_KEY=your_secure_api_key_here     # Matches NEXT_PUBLIC_DASHBOARD_API_KEY in Dashboard

# Bot Super Admins / Developer IDs (Comma-separated)
OWNER_IDS=your_discord_user_id

# Security Mode
# 'false' = Live enforcement (instant real bans/kicks)
# 'true'  = Dry-run mode (logs actions without kicking/banning)
SECURITY_DRY_RUN=false
```

---

## 🔑 Discord Developer Portal Settings

To ensure all security and AutoMod features work properly, configure your bot application in the [Discord Developer Portal](https://discord.com/developers/applications):

1. Navigate to your application -> **Bot** tab.
2. Under **Privileged Gateway Intents**, enable:
   - ✅ **Presence Intent**
   - ✅ **Server Members Intent** (Required for Anti-Kick, Anti-Bot Add, and Auto-Recovery)
   - ✅ **Message Content Intent** (Required for AutoMod URL/Invite/Spam detection)
3. Under **OAuth2** -> **URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: Select `Administrator` (Recommended so the bot has authority to ban executors and recreate channels/roles).
4. **Role Hierarchy in Discord**:
   - In your Discord Server Settings -> **Roles**, drag the bot's highest role (`AegisX` / `AegisX Supreme™`) to the **very top** of the role list so it can moderate members and roles below it.

---

## 🏗️ Build & Run

### 1. Build the Entire Monorepo
Compile TypeScript across `@aegisx/database`, `@aegisx/redis`, and `apps/bot`:
```bash
npm run build
```

### 2. Start in Development Mode (Live Reload)
```bash
npm run dev:bot
```

### 3. Start in Production Mode
```bash
npm --workspace apps/bot run start
```

---

## 🎮 Discord Slash Commands Reference

| Command | Subcommands / Options | Description | Permission |
| :--- | :--- | :--- | :--- |
| `/antinuke` | `enable` | Enables Anti-Nuke defense and creates `AegisX Supreme™` role | Owner / Extra Owner |
| `/antinuke` | `disable` | Deactivates Anti-Nuke defense mode | Owner / Extra Owner |
| `/antinuke` | `config` | Displays current security status and punishment type | Owner / Extra Owner |
| `/antinuke` | `action <ban\|kick\|strip_roles>` | Changes the punishment action for triggers | Owner / Extra Owner |
| `/whitelist` | `add <user>` | Opens an interactive select menu to grant granular bypasses | Owner / Extra Owner |
| `/whitelist` | `remove <user>` | Revokes all bypass permissions from a user | Owner / Extra Owner |
| `/whitelist` | `list` | Lists all whitelisted users and their active permissions | Owner / Extra Owner |
| `/whitelist` | `reset` | Clears all whitelisted users on the server | Owner / Extra Owner |
| `/extraowner`| `set <user>` | Appoints a trusted user as Extra Owner (with confirm prompt) | Server Owner |
| `/extraowner`| `remove <user>` | Removes an Extra Owner | Server Owner |
| `/extraowner`| `view` | Lists currently appointed Extra Owners | Server Owner |
| `/extraowner`| `reset` | Clears all Extra Owners | Server Owner |
| `/automod`   | `enable` | Enables the AutoMod protection engine | Admin |
| `/automod`   | `disable` | Disables the AutoMod protection engine | Admin |
| `/automod`   | `punishment <event> <action>` | Sets punishment (`Mute`, `Kick`, `Ban`, `Block`) for rules | Admin |
| `/automod`   | `logging <channel>` | Sets the text channel for AutoMod incident reports | Admin |
| `/automod`   | `ignore channel\|role <target>` | Exempts specific channels or roles from AutoMod | Admin |
| `/automod`   | `unignore channel\|role <target>` | Removes exemptions from channels or roles | Admin |
| `/automod`   | `config` | Displays active AutoMod rules and ignored entities | Admin |

---

## 🌐 Dashboard REST API Endpoints

The built-in Express server exposes standard REST endpoints under `/api/v1/`:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/health` | `GET` | Health check endpoint |
| `/api/v1/bot/status` | `GET` | Real-time statistics (guilds, members, ping, uptime, RAM) |
| `/api/v1/bot/info` | `GET` | Bot user profile and runtime information |
| `/api/v1/guilds/` | `GET` | List of all mutual guilds |
| `/api/v1/guilds/:guildId` | `GET` | Detailed guild metrics (channel/role counts, owner) |
| `/api/v1/guilds/:guildId/channels` | `GET` | Guild channel structure |
| `/api/v1/guilds/:guildId/roles` | `GET` | Guild roles with permission bitfields |
| `/api/v1/guilds/:guildId/prefix` | `GET`, `POST` | Get or update command prefix |
| `/api/v1/guilds/:guildId/antinuke` | `GET`, `PATCH` | Manage Anti-Nuke state, whitelists, extra-owners |
| `/api/v1/guilds/:guildId/automod` | `GET`, `PATCH` | Manage AutoMod rules, punishments, ignored lists |
| `/api/v1/guilds/:guildId/logging` | `GET`, `PATCH` | Manage logging channels |
| `/api/v1/guilds/:guildId/autorole` | `GET`, `PATCH` | Configure human and bot join roles |
| `/api/v1/guilds/:guildId/verification` | `GET`, `PATCH` | Configure member verification system |
| `/api/v1/guilds/:guildId/vanityroles` | `GET`, `POST`, `DELETE` | Manage vanity status roles |
| `/api/v1/guilds/:guildId/welcome` | `GET`, `PATCH` | Configure welcome messages and cards |
| `/api/v1/guilds/:guildId/tickets` | `GET`, `PATCH` | Configure ticket panels and categories |
| `/api/v1/guilds/:guildId/leveling` | `GET`, `PATCH` | Configure XP and leveling rewards |
| `/api/v1/admin/stats` | `GET` | Host server CPU, memory, and Node.js metrics |

---

## 📁 Repository Structure

```
AegisX/
├── package.json                          # Monorepo configuration
├── .env.example                          # Environment variables template
├── packages/
│   ├── database/                         # MongoDB & Mongoose Schema Layer
│   │   ├── src/models/GuildConfig.ts     # Data models
│   │   └── src/repositories/             # CRUD query repositories
│   └── redis/                            # Redis Caching Layer
│       ├── src/client.ts                 # Redis connection manager
│       └── src/cache.ts                  # Cache get/set/invalidate helpers
└── apps/
    └── bot/                              # Discord Bot Engine & REST API
        ├── src/index.ts                  # Entrypoint
        ├── src/api/                      # Express REST API
        ├── src/commands/                 # Slash commands
        ├── src/events/                   # Discord Gateway event listeners
        └── src/security/
            ├── antinuke/                 # Anti-Nuke engine & recovery service
            ├── automod/                  # AutoMod rules & evaluation service
            ├── decision/                 # Audit log decision evaluator
            ├── enforcement/              # Discord punishment executor
            └── exemptions/               # Immunity & whitelist checker
```

---

## 🤝 Contributing & Support
Feel free to open an issue or submit a pull request if you encounter any bugs or would like to propose new features.

**Author**: DevNest-Prince  
**Repository**: [Discord-Security-bot](https://github.com/DevNest-Prince/Discord-Security-bot)
