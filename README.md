# 🛡️ Prinex Discord Security Bot

A production-grade Discord security bot built with Discord.js v14, TypeScript, MongoDB, and Redis. Features anti-spam automation, granular whitelisting, and a modern, professional interface.

## ✨ Features

### 🚀 Core Capabilities
- **Anti-Spam Detection**: Redis-backed rate limiting with intelligent whitelist bypassing
- **Granular Whitelisting**: Support for members, roles, channels, and categories
- **System Diagnostics**: Real-time latency and health monitoring for bot, database, and cache
- **Server Information**: Detailed guild statistics and member profiles
- **Dual Command Support**: Slash commands (modern) + Prefix commands (legacy)

### 📊 Commands
- `/ping` - Check system latency and service health
- `/serverinfo` - Display comprehensive server statistics  
- `/userinfo [user]` - View detailed user profiles with roles
- `/help` - Interactive command menu with categorized features
- `/whitelist` - Manage security whitelists (view/add/remove)

### 🔐 Security
- Admin-only commands with permission checks
- Secure MongoDB + Redis configuration storage
- Graceful error handling with fallbacks
- Audit logging foundation for future events

## 🛠️ Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Bot Framework | Discord.js | 14.27 |
| Language | TypeScript | 7.0 |
| Runtime | Node.js | 20+ |
| Primary Database | MongoDB | 7.5 |
| Cache Layer | Redis | 6.2 |
| Logger | Pino | 10.3 |
| Validation | Zod | 4.4 |

## 📋 Prerequisites

- **Node.js** 20.0 or higher
- **MongoDB** 5.0 or higher
- **Redis** 6.0 or higher
- Discord Bot with intents enabled:
  - `Guilds`
  - `GuildMessages`
  - `MessageContent`
  - `GuildMembers`

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd Discord-Security-bot
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:

```env
# Discord Configuration
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id
DISCORD_DEV_GUILD_ID=your_dev_server_id

# Database Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=prinex

# Cache Configuration
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

### 3. Register Slash Commands
```bash
npm run register-dev
```

This creates slash commands in your development guild.

### 4. Start the Bot
```bash
# Development (auto-reload on changes)
npm run dev

# Production
npm run build
npm start
```

## 📖 Usage Examples

### Anti-Spam Feature
```
User spams 4+ messages in 5 seconds
→ AutoMod detects and deletes messages
→ User receives warning

Unless user/role/channel is whitelisted:
/whitelist add role @Trusted
/whitelist add user @ServiceBot
/whitelist add channel #bot-spam
```

### Server Information
```
/serverinfo
→ Shows: Owner, ID, members, channels, roles, boost status
```

### User Profiles
```
/userinfo @username
→ Shows: ID, account age, server join date, roles
```

### Whitelist Management
```
/whitelist view
→ Lists all whitelisted items with auto-cleanup

/whitelist add role @Moderator
→ All Moderators bypass spam detection

/whitelist remove user @SpamUser
→ Removes user from whitelist
```

## 📁 Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete architectural documentation, including:
- Service layer design
- Database schema
- Error handling strategy
- Future dashboard integration patterns

## 🔧 Available Scripts

```bash
npm run dev        # Start in development mode with auto-reload
npm run build      # Compile TypeScript to JavaScript
npm start          # Run production build
npm run lint       # Check code with ESLint
npm run format     # Format code with Prettier
npm run typecheck  # Run TypeScript type checking
npm test           # Run tests with Vitest
```

## 🗄️ Database Schema

### Guild Configuration
```typescript
{
  guildId: string;
  prefix: string;                    // Custom command prefix
  automod: {
    spam: {
      enabled: boolean;
      threshold: number;             // Messages per window
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

### Caching
- **Redis prefix channel config**: 1-hour TTL
- **Redis spam counters**: 5-second TTL
- **Auto-invalidation** on config updates

## 🔐 Permissions

| Command | Required Permission |
|---------|-------------------|
| `/ping` | None |
| `/serverinfo` | None |
| `/userinfo` | None |
| `/help` | None |
| `/whitelist` | Administrator |

## 📊 System Monitoring

Use `/ping` to monitor system health:
- **Bot Latency**: Discord.js WebSocket latency
- **MongoDB**: Database connection health & response time
- **Redis**: Cache layer status & response time

## 🐛 Troubleshooting

### Bot doesn't respond to commands
1. Verify `DISCORD_TOKEN` in `.env`
2. Run `npm run register-dev` to register slash commands
3. Check bot has "Send Messages" permission in guild
4. Verify environment variables are loaded

### Database connection fails
- Check `MONGODB_URI` is correct
- Ensure MongoDB service is running
- Check network connectivity

### Whitelist not working
- Verify user/role/channel exists
- Use `/whitelist view` to confirm entries
- Admin-only command requires permission

### Command timeouts
- Slash commands auto-defer for long operations
- Check bot isn't rate-limited by Discord
- Monitor `/ping` for system issues

## 🚀 Future Features

- Auto-moderation triggers (kick, mute, ban)
- Advanced logging with audit trails
- Anti-nuke protection (mass channel/role deletion)
- Custom trigger words or phishing detection
- Web dashboard for configuration
- Role-specific moderation settings
- Appeal system for warns/bans

## 💡 Production Checklist

- [ ] Update `DISCORD_CLIENT_ID` for production application
- [ ] Use production MongoDB cluster (not local)
- [ ] Configure Redis with authentication
- [ ] Enable error monitoring/alerting
- [ ] Set `NODE_ENV=production`
- [ ] Regular database backups configured
- [ ] Monitor bot health with `/ping`
- [ ] Implement rate limiting for dashboard (future)
- [ ] Document custom server configurations

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## 📝 Code Style

- **Language**: TypeScript with `strict: true`
- **Formatter**: Prettier (2-space indentation)
- **Linter**: ESLint
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for public APIs, inline for complex logic

## 📄 License

This project is licensed under the ISC License.

## 🙋 Support

- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation
- Review command implementations in `src/modules/utility/commands/`
- Check service layer in `src/services/`

## 🔗 Links

- [Discord.js Documentation](https://discord.js.org)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Redis Documentation](https://redis.io/docs)

---

**Prinex Security Bot** - Protecting Discord communities, one server at a time. 🛡️
