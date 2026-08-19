# Prinex Discord Security Bot - Production Architecture Guide

## 🎯 Project Overview

Prinex is a production-grade Discord Security Bot built with:
- **Framework**: Discord.js v14
- **Language**: TypeScript (ES2022)
- **Databases**: MongoDB (config storage) + Redis (caching & rate limiting)
- **Logging**: Pino with pretty-print in dev mode
- **Validation**: Zod for environment variables

## 📁 Architecture & Folder Structure

```
src/
├── index.ts                 # Main bot entry point
├── app/                     # Application-level setup (future dashboard)
├── commands/
│   ├── prefix/             # Prefix command handlers (for future expansion)
│   └── slash/              # Slash command implementations
│       └── whitelist.ts    # Production whitelist management
├── config/
│   └── env.ts             # Environment validation with Zod
├── core/
│   └── logger.ts          # Pino logger configuration
├── database/
│   ├── client.ts          # MongoDB connection & management
│   └── redis.ts           # Redis connection & health checks
├── events/
│   ├── interactionCreate.ts  # Slash command handler
│   └── messageCreate.ts       # Prefix command + AutoMod handler
├── modules/
│   └── utility/
│       ├── commands/      # Utility command implementations
│       │   ├── help.ts
│       │   ├── ping.ts
│       │   ├── serverinfo.ts
│       │   ├── userinfo.ts
│       │   └── whitelist.ts (legacy prefix version)
│       └── services/
│           └── UtilityService.ts  # Helper functions for utilities
├── services/
│   ├── AutoModService.ts    # Spam detection with whitelisting
│   └── GuildConfigService.ts # Guild configuration management
├── types/
│   └── database.ts          # TypeScript schema definitions
└── ui/
    ├── colors.ts           # Embed color constants
    ├── icons.ts           # Emoji icon constants
    ├── buttons/           # Button component builders (for future)
    ├── embeds/
    │   └── builders.ts    # Professional embed factory functions
    ├── menus/             # Select menu builders (for future)
    └── modals/            # Modal builders (for future)
```

## 🔐 Core Services

### GuildConfigService
**Purpose**: Manages all guild configuration with Redis caching

**Key Methods**:
- `getConfig(guildId)` - Fetch full guild config with fallbacks
- `getPrefix(guildId)` - Get guild prefix (defaults to `p!`)
- `setPrefix(guildId, newPrefix)` - Update prefix
- `updateWhitelist()` - Add/remove items from whitelists
- `getWhitelist(guildId, type)` - Get specific whitelist

**Database Schema**:
```typescript
{
  guildId: string;
  prefix: string;
  automod: {
    spam: {
      enabled: boolean;
      threshold: number;
      whitelistedMembers: string[];
      whitelistedRoles: string[];
      whitelistedChannels: string[];
      whitelistedCategories: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### AutoModService
**Purpose**: Spam detection with Redis-backed rate limiting

**Features**:
- ✅ Threshold-based spam detection (3 messages per 5 seconds)
- ✅ Granular whitelisting support
- ✅ Role-based bypass
- ✅ Channel & category bypass
- ✅ Member whitelist
- ✅ Graceful fallback on Redis errors

**Key Methods**:
- `checkSpam(message)` - Returns `true` if spam detected
- `resetSpamCounter(guildId, userId)` - Clear warning level
- `getSpamLevel(guildId, userId)` - Get current warning (0-4)

### UtilityService
**Purpose**: Helper functions for system diagnostics

**Key Methods**:
- `getSystemPing(client)` - Returns bot latency, DB status, Redis status

## 🎮 Slash Commands (Production Ready)

### `/ping`
- **Purpose**: Check system health
- **Latency**: Bot, WebSocket, MongoDB, Redis
- **Ephemeral**: No (visible to all)
- **Deferrable**: Yes (uses `deferReply`)

### `/serverinfo`
- **Purpose**: Display guild statistics
- **Info**: Owner, ID, creation date, members, channels, roles, boost status
- **Ephemeral**: No
- **Deferrable**: Yes

### `/userinfo [user]`
- **Purpose**: Display user profile details
- **Info**: ID, account creation, server join date, roles
- **Ephemeral**: No
- **Deferrable**: Yes
- **Parameter**: Optional user mention (defaults to command issuer)

### `/help`
- **Purpose**: Interactive help menu
- **Features**: Categorized commands, upcoming features
- **Ephemeral**: No
- **Deferrable**: No

### `/whitelist`
**Requires**: Administrator permission

**Subcommands**:

#### `/whitelist view`
- Lists all whitelisted items
- Auto-cleans up deleted roles/channels
- Shows counts for each category

#### `/whitelist add <type> <target>`
- Types: role, user, channel, category
- Automatically detects mentions or IDs
- Prevents duplicates

#### `/whitelist remove <type> <target>`
- Removes from whitelists
- Supports removal even if item no longer exists
- Confirms successful removal

## 📝 Prefix Commands

All slash commands have prefix aliases (use `p!ping`, `p!help`, etc.)

- `p!ping` / `p!latency`
- `p!serverinfo` / `p!guildinfo` / `p!server`
- `p!userinfo` / `p!whois` / `p!user`
- `p!help` / `p!commands` / `p!menu`
- `p!whitelist` / `p!wl`

## 🎨 Modern Embed System

All embeds use production-grade builders with consistent styling:

### Builder Functions
```typescript
createBaseEmbed()              // Base embed with timestamp
createSuccessEmbed(desc)       // Green success embed
createErrorEmbed(desc)         // Red error embed
createWarningEmbed(desc)       // Yellow warning embed
createInfoEmbed(title, desc)   // Blue info embed
createSecurityEmbed(title, desc) // Purple security embed

// Specialized builders
createSystemStatusEmbed()      // For ping command
createGuildInfoEmbed()         // For serverinfo command
createUserProfileEmbed()       // For userinfo command
createWhitelistEmbed()         // For whitelist display
createHelpCategoryEmbed()      // For help categorization
createConfirmationEmbed()      // For confirmations
createAuditEmbed()             // For audit logging (future)
```

### Colors & Icons
- **Colors**: SUCCESS, ERROR, WARNING, INFO, SECURITY, BRAND (Discord Blue), etc.
- **Icons**: Full set of Unicode emojis for UI consistency

## ⏱️ 3-Second Response Guarantee

All slash commands follow Discord's 3-second interaction response deadline:

```typescript
// Pattern 1: Quick response (< 1 second of processing)
await interaction.reply({ embeds: [embed] });

// Pattern 2: Deferred response (for slower operations)
await interaction.deferReply();
// ... do work ...
await interaction.editReply({ embeds: [embed] });

// Pattern 3: Fallback (if already replied)
if (interaction.replied || interaction.deferred) {
  await interaction.followUp({ embeds: [embed] });
}
```

## 🛡️ Error Handling Strategy

### Service Layer (Database/Redis)
- Try-catch blocks log errors
- Graceful fallback to safe defaults
- Fail-open approach: allow operation on error, don't crash

### Command Layer
- Pre-defer for slash commands
- Proper error reply with ephemeral flag
- Context-aware error messages

### Event Handler
- Global try-catch per interaction
- Error logging with context
- Fallback error embed

## 🚀 Future-Proofing for Dashboard

### Structure for Dashboard Integration
```
Backend API (this bot):
├── MongoDB for persistence
├── Redis for caching
├── REST endpoints (to be added)
└── Real-time config hooks

Dashboard (future):
├── React/Next.js frontend
├── REST API integration
├── WebSocket for real-time updates
└── Config management UI
```

### Dashboard-Ready Patterns
- ✅ Strongly typed schema definitions
- ✅ Service abstraction (easy to replace with REST endpoints)
- ✅ Consistent error responses
- ✅ Clean config structure
- ✅ Audit logging foundation

## 📊 Database Management

### MongoDB Collections
- `guild_configs` - Guild settings and whitelists

### Redis Keys
- `guild:{guildId}:prefix` - TTL: 1 hour
- `guild:{guildId}:config` - TTL: 1 hour
- `spam:{guildId}:{userId}` - TTL: 5 seconds

## 🔧 Development & Deployment

### Environment Variables
```bash
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_DEV_GUILD_ID=dev_guild_id
MONGODB_URI=mongodb://...
MONGODB_DB_NAME=prinex
REDIS_URL=redis://...
NODE_ENV=development|production
```

### Scripts
```bash
npm run dev       # Development with tsx watch
npm run build     # Compile TypeScript
npm start         # Run production build
npm run lint      # Run ESLint
npm run format    # Format with Prettier
npm run typecheck # Type checking
npm test          # Run tests with Vitest
```

### Command Registration
```bash
# Register slash commands for dev guild
npm run register-dev

# Creates the `/ping`, `/serverinfo`, `/userinfo`, `/help`, `/whitelist` commands
```

## 🎯 Best Practices Implemented

1. **Type Safety**: Full TypeScript with strict mode
2. **Error Resilience**: Fallbacks prevent cascade failures
3. **Performance**: Redis caching for frequently accessed data
4. **Maintainability**: Clean service layer abstraction
5. **Logging**: Structured logging with Pino
6. **UI Consistency**: Professional embed builders
7. **Discord Compliance**: 3-second response guarantee
8. **Security**: Permission checks before sensitive operations
9. **Accessibility**: Clear error messages and help text
10. **Scalability**: Database-driven configuration

## 📈 Monitoring & Observability

**Via `/ping` command**:
- Bot WebSocket latency
- MongoDB connection health
- Redis connection health
- Response times for all services

**Via Logs**:
```
[INFO] Bot successfully logged in and is now ONLINE! 🚀
[WARN] Discord rate limited
[ERROR] Database connection failed
[DEBUG] Command executed: /serverinfo
```

## 🔄 Workflow Example: Adding a New Command

1. **Create command file** in `src/commands/slash/` or `src/modules/utility/commands/`
2. **Implement execute function** with proper error handling
3. **Register in event handler** (`interactionCreate.ts` or `messageCreate.ts`)
4. **Add to slash registration** in `scripts/register-dev.ts`
5. **Use embed builders** from `ui/embeds/builders.ts`
6. **Add tests** in `tests/`

## 🚨 Common Issues & Solutions

### Bot not responding to commands?
- Check `DISCORD_TOKEN` in .env
- Run `npm run register-dev` to register slash commands
- Verify bot has proper permissions in guild

### Database errors?
- All operations have fallbacks to prevent crashes
- Check MongoDB connection in logs
- Redis errors are logged but don't stop execution

### Whitelist not working?
- Check member roles with `/userinfo`
- Verify whitelist with `/whitelist view`
- Auto-cleanup removes deleted roles/channels

## 📚 Additional Resources

- [Discord.js Documentation](https://discord.js.org)
- [MongoDB Guide](https://docs.mongodb.com)
- [Redis Documentation](https://redis.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

**Prinex Security Bot v1.0.0** - Built for production-grade reliability and future scalability.
