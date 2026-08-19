# 🚀 Production Deployment Guide

## Pre-Deployment Checklist

Before deploying Prinex to production, complete all items below.

---

## ✅ Environment Configuration

### 1. Create Production `.env` File
```bash
# Copy development .env as template
cp .env .env.production

# Update with production values:
DISCORD_TOKEN=your_production_bot_token
DISCORD_CLIENT_ID=your_production_client_id
DISCORD_DEV_GUILD_ID=your_production_guild_id  # Can be same or different

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB_NAME=prinex_prod

REDIS_URL=redis://:password@redis-host:6379
NODE_ENV=production
```

### 2. Verify All Secrets
- [ ] `DISCORD_TOKEN` is production bot token (not personal token)
- [ ] `DISCORD_CLIENT_ID` matches production bot application
- [ ] MongoDB uses production cluster (not localhost)
- [ ] Redis is properly configured with auth
- [ ] No secrets committed to version control

---

## 🤖 Discord Bot Configuration

### 1. Update Bot Permissions
In [Discord Developer Portal](https://discord.com/developers/applications):

**Select your bot application → OAuth2 → URL Generator**

Required scopes:
- [ ] `bot`

Required permissions:
- [ ] Send Messages
- [ ] Embed Links
- [ ] Read Message History
- [ ] Read Messages/View Channels

Generated URL:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_ID&permissions=395137&scope=bot
```

### 2. Set Bot Intents
**Settings → Installation → Installation URL Type**
- [x] Guild Install
- [ ] User Install (not needed)

**Settings → Bot → Privileged Gateway Intents**
- [x] Message Content Intent (required for prefix commands)
- [x] Server Members Intent (optional, for member info)

### 3. Configure Redirect URL (for future dashboard)
**OAuth2 → Redirects**
- [ ] Add: `https://your-domain.com/auth/callback` (for dashboard)

---

## 🗄️ Database Setup

### 1. MongoDB Production Cluster

**Local Development** (for testing):
```bash
# Start local MongoDB
mongod --dbpath ./data
```

**Production** (use MongoDB Atlas):
1. Create cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create database user with strong password
3. Add IP whitelist for deployment server
4. Get connection URI
5. Test connection before deployment

**Verify Connection**:
```bash
npm run build
npm start
# Check logs for "MongoDB connected successfully"
```

### 2. Create Required Collections
MongoDB auto-creates collections, but verify:

```javascript
// Check in MongoDB Console
use prinex_prod
db.guild_configs.find().pretty()  // Should show guild configurations
```

### 3. Create Indexes (Optional but Recommended)
```javascript
// In MongoDB Console
use prinex_prod
db.guild_configs.createIndex({ guildId: 1 })
```

---

## ⚡ Redis Setup

### 1. Production Redis Instance

**Local Testing**:
```bash
redis-server
redis-cli ping  # Should respond with PONG
```

**Production** (use Redis Cloud or AWS ElastiCache):
1. Create Redis instance
2. Enable authentication
3. Configure firewall/security group
4. Get connection URL
5. Test before deployment

**Verify Connection**:
```bash
# In your bot logs, should see:
# "Redis connected successfully"
```

### 2. Redis Configuration

**Data Backup**:
```bash
# Enable RDB persistence
save 900 1      # Save if 1 key changed in 900 seconds
save 300 10     # Save if 10 keys changed in 300 seconds
```

**Memory Limits**:
```bash
maxmemory: 256mb (for starting)
maxmemory-policy: allkeys-lru (remove least-used keys)
```

---

## 🔨 Application Build & Deploy

### 1. Build for Production
```bash
# Clean previous builds
rm -rf dist/

# Compile TypeScript
npm run build

# Verify build succeeded
ls -la dist/  # Should contain index.js and other compiled files
```

### 2. Verify All Commands
```bash
# Re-register slash commands for production
npm run register-dev  # (or create production-specific registration)
```

### 3. Run Local Smoke Test
```bash
# Test in development first
NODE_ENV=development npm start

# Use /ping command to verify:
# ✅ Bot responsive
# ✅ Database connected
# ✅ Redis working
```

---

## 🔐 Security Hardening

### 1. Environment Variables
- [ ] Verify no secrets in `src/` files
- [ ] No `.env` file in git (check `.gitignore`)
- [ ] All secrets in environment variables
- [ ] Use secrets management for production

### 2. Database Security
- [ ] MongoDB user has limited permissions (not admin)
- [ ] Redis requires password authentication
- [ ] Both databases have firewall rules
- [ ] Connection strings use TLS/SSL where available

### 3. Bot Security
- [ ] Bot token not shared/exposed
- [ ] Prefix commands require proper validation
- [ ] Admin commands check permissions
- [ ] Error messages don't leak system info
- [ ] Rate limiting functional

### 4. Monitoring & Alerts
- [ ] Enable bot monitoring/alerting
- [ ] Monitor error logs
- [ ] Set up database backups
- [ ] Configure log retention

---

## 🚀 Deployment Options

### Option 1: VPS/Server Deployment
```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Clone repository
git clone <your-repo> discord-bot
cd discord-bot

# 3. Install dependencies
npm install --production

# 4. Create .env with production values
nano .env

# 5. Build application
npm run build

# 6. Start bot (use PM2 for auto-restart)
npm install -g pm2
pm2 start dist/index.js --name "prinex-bot"
pm2 startup
pm2 save
```

### Option 2: Docker Deployment
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

```bash
# Build and run
docker build -t prinex-bot .
docker run -d --env-file .env.production prinex-bot
```

### Option 3: Cloud Platform (Heroku, Railway, Replit)
1. Connect repository
2. Set environment variables in platform settings
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Deploy

---

## 📊 Post-Deployment Verification

### 1. Bot Status Check (Do Immediately)
```
/ping  ← Should respond with latencies
```

Expected response:
```
🤖 System Operational
Bot Latency:   45ms  (< 100ms ✅)
WebSocket:     45ms
MongoDB:       12ms  (< 100ms ✅)
Redis:         3ms   (< 10ms ✅)
```

### 2. Full Command Verification
- [ ] `/ping` responds
- [ ] `/serverinfo` shows guild info
- [ ] `/userinfo @someone` shows user profile
- [ ] `/help` displays menu
- [ ] `/whitelist view` shows whitelist
- [ ] `/whitelist add role @Test` works
- [ ] All prefix commands work with `p!`

### 3. Database Verification
```
/ping → Check MongoDB latency (healthy: < 100ms)
See logs for "Database: Xms" output
```

### 4. Cache Verification
```
/ping → Check Redis latency (healthy: < 10ms)
See logs for "Redis: Xms" output
```

### 5. Error Handling Verification
```
# Test error scenarios:
Use invalid role ID in /whitelist add
Use without admin permission
Check error messages are user-friendly
```

---

## 📈 Monitoring & Maintenance

### Daily Monitoring
```bash
# Check bot status (in Discord)
/ping

# Monitor output:
- Bot latency trends
- Database performance
- Redis response times
```

### Weekly Maintenance
- [ ] Review error logs
- [ ] Check database size
- [ ] Verify backups completed
- [ ] Monitor memory/CPU usage

### Monthly Maintenance
- [ ] Review guild configurations
- [ ] Clean up old audit logs (if present)
- [ ] Update dependencies: `npm update`
- [ ] Review security advisories: `npm audit`

---

## 🐛 Production Troubleshooting

### Bot Offline
```
1. Check server process is running
2. Verify .env variables are set correctly
3. Check firewall/network connectivity
4. Review error logs for specific error
```

### Commands Not Working
```
1. Run /ping - should respond
2. Verify slash commands are registered
3. Check bot permissions in Discord
4. Review logs for errors
```

### Database Connection Errors
```
1. Verify MONGODB_URI in .env
2. Check MongoDB is running and accessible
3. Verify connection string is correct
4. Check firewall allows connection
```

### Redis Connection Errors
```
1. Verify REDIS_URL in .env
2. Check Redis is running
3. Verify authentication credentials
4. Check network connectivity
```

### Slow Response Times
```
/ping output shows latencies:
- Bot latency > 100ms: Network issue
- MongoDB > 100ms: Database overload
- Redis > 10ms: Cache performance issue
```

---

## 🔄 Update & Rollback Procedures

### Updating Bot
```bash
# 1. Pull latest code
git pull origin main

# 2. Stop running bot
pm2 stop prinex-bot

# 3. Install/update dependencies
npm install

# 4. Build new version
npm run build

# 5. Restart bot
pm2 start prinex-bot

# 6. Verify with /ping
```

### Rolling Back
```bash
# 1. Stop bot
pm2 stop prinex-bot

# 2. Reset to previous version
git revert <commit-hash>

# 3. Rebuild
npm install && npm run build

# 4. Restart
pm2 start prinex-bot

# 5. Verify with /ping
```

---

## 📋 Production Configuration Best Practices

### Environment Variables
```bash
# Never commit .env files
# Use environment variable management:
# - Heroku Config Vars
# - AWS Systems Manager Parameter Store
# - Google Secret Manager
# - HashiCorp Vault
```

### Logging Configuration
```bash
# Production: INFO level (less verbose)
# NODE_ENV=production → INFO logs only

# Development: DEBUG level (verbose)
# NODE_ENV=development → DEBUG logs included
```

### Error Tracking (Optional)
```bash
# Add error monitoring service
# Examples: Sentry, DataDog, New Relic
# Captures production errors with context
```

---

## ✨ Launch Checklist

- [ ] Environment variables configured
- [ ] Discord bot permissions set
- [ ] Database (MongoDB) accessible
- [ ] Cache (Redis) accessible
- [ ] Application builds without errors
- [ ] Slash commands registered
- [ ] `/ping` responds with healthy metrics
- [ ] All commands tested in guild
- [ ] Error handling verified
- [ ] Monitoring/alerting enabled
- [ ] Backups configured
- [ ] Team trained on operations
- [ ] Documentation reviewed
- [ ] Security checklist completed

---

## 🎉 Production Launch

Once all items are checked:

```bash
# 1. Final verification
/ping  ← Verify all systems healthy

# 2. Announce to guild (optional)
"Prinex Bot is now online! Use /help for commands."

# 3. Monitor first 24 hours
Check logs hourly
Verify no errors
Monitor latency trends

# 4. Proceed with normal operations
```

---

## 📞 Support Contacts

- **Discord API Issues**: Discord.js docs or Discord support
- **MongoDB Issues**: MongoDB documentation or support
- **Redis Issues**: Redis documentation or support
- **Bot Issues**: Review logs and ARCHITECTURE.md

---

## 📚 Additional Resources

- [Discord.js Deployment Guide](https://discordjs.guide/getting-started/making-your-bot-public.html)
- [MongoDB Production Checklist](https://docs.mongodb.com/manual/administration/production-checklist-checklist/)
- [Redis Production Guide](https://redis.io/docs/management/admin/readme/)

---

**Your bot is now production-ready! 🚀**

Monitor `/ping` regularly to ensure system health.
Review `DEVELOPMENT.md` for adding new features.
