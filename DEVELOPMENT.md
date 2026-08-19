# 🏗️ Development Guide & Best Practices

## Local Development Setup

### Prerequisites
- Node.js 20.0+
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Discord application with bot token

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Fill in your values
   DISCORD_TOKEN=your_token
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_DEV_GUILD_ID=your_guild_id
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=prinex
   REDIS_URL=redis://localhost:6379
   NODE_ENV=development
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Register Commands**
   ```bash
   npm run register-dev
   ```

## 🎯 Code Organization

### Adding a New Slash Command

1. **Create Command File**
   ```typescript
   // src/commands/slash/mycommand.ts
   import { CommandInteraction } from 'discord.js';
   import { createInfoEmbed } from '../../ui/embeds/builders.js';
   
   export const MyCommand = {
     name: 'mycommand',
     description: 'What this command does',
     
     async execute(interaction: CommandInteraction) {
       // 1. Defer if needed (for async operations)
       if (/* long operation */) {
         await interaction.deferReply({ ephemeral: false });
       }
       
       // 2. Perform operations
       const result = await someAsyncOp();
       
       // 3. Build response embed
       const embed = createInfoEmbed('Title', 'Description')
         .addFields({ name: 'Field', value: 'Value' });
       
       // 4. Send response
       if (interaction.deferred) {
         await interaction.editReply({ embeds: [embed] });
       } else {
         await interaction.reply({ embeds: [embed] });
       }
     }
   };
   ```

2. **Register in Event Handler**
   ```typescript
   // src/events/interactionCreate.ts
   import { MyCommand } from '../commands/slash/mycommand.js';
   
   const commands = new Map();
   commands.set(MyCommand.name, MyCommand);
   ```

3. **Add to Slash Command Registration**
   ```typescript
   // scripts/register-dev.ts
   new SlashCommandBuilder()
     .setName('mycommand')
     .setDescription('What this command does')
     .addStringOption(option =>
       option.setName('argument')
         .setDescription('Argument description')
         .setRequired(true)
     )
     .toJSON()
   ```

### Adding a New Service

1. **Create Service File**
   ```typescript
   // src/services/MyService.ts
   import { logger } from '../core/logger.js';
   
   export class MyService {
     static async myMethod(): Promise<string> {
       try {
         // Implementation
         logger.debug('Operation completed');
         return 'result';
       } catch (error) {
         logger.error({ err: error }, 'Operation failed');
         throw error;
       }
     }
   }
   ```

2. **Use in Commands**
   ```typescript
   import { MyService } from '../services/MyService.js';
   
   const result = await MyService.myMethod();
   ```

## 🎨 Embed Design Patterns

### Pattern 1: Simple Message
```typescript
const embed = createSuccessEmbed('Operation successful!');
await interaction.reply({ embeds: [embed] });
```

### Pattern 2: Detailed Information
```typescript
const embed = createInfoEmbed('User Profile', 'Details:')
  .addFields(
    { name: 'Name', value: 'John', inline: true },
    { name: 'ID', value: '12345', inline: true },
    { name: 'Bio', value: 'Developer', inline: false }
  );
await interaction.reply({ embeds: [embed] });
```

### Pattern 3: Error Handling
```typescript
try {
  // Do something
} catch (error) {
  logger.error({ err: error }, 'Operation failed');
  const embed = createErrorEmbed('Failed to complete operation');
  
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ embeds: [embed], ephemeral: true });
  } else {
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
```

### Pattern 4: Progressive Disclosure
```typescript
// Defer for operations taking < 3 seconds
await interaction.deferReply();

// Perform async operations
const data = await fetchExpensiveData();

// Send final response
await interaction.editReply({ embeds: [createResultEmbed(data)] });
```

## 📊 Service Layer Patterns

### Database Operations with Fallbacks
```typescript
static async getSafeData(id: string): Promise<Data> {
  try {
    // Try cache first
    const cached = await cache.get(id);
    if (cached) return cached;
    
    // Fallback to database
    const db = getDb();
    const data = await db.collection('data').findOne({ id });
    
    // Cache result
    if (data) {
      await cache.set(id, data, 3600);
    }
    
    return data || getDefaultData();
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch data');
    return getDefaultData(); // Always return safe default
  }
}
```

### Error Resilience
```typescript
// DON'T: Let errors propagate
await database.update(query).catch(); // ❌ Silently fails

// DO: Log and handle
try {
  await database.update(query);
} catch (error) {
  logger.error({ err: error, query }, 'Update failed');
  // Continue or throw with context
}
```

## 🧪 Testing Strategies

### Unit Testing Commands
```typescript
// tests/commands/mycommand.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MyCommand } from '../../src/commands/slash/mycommand';

describe('MyCommand', () => {
  it('should execute without errors', async () => {
    const mockInteraction = {
      deferReply: vi.fn(),
      editReply: vi.fn(),
    };
    
    await MyCommand.execute(mockInteraction as any);
    expect(mockInteraction.deferReply).toHaveBeenCalled();
  });
});
```

### Integration Testing Services
```typescript
// tests/services/guild-config.test.ts
describe('GuildConfigService', () => {
  it('should return default prefix if not configured', async () => {
    const prefix = await GuildConfigService.getPrefix('test-guild');
    expect(prefix).toBe('p!');
  });
});
```

## 🔍 Debugging Tips

### Enable Debug Logging
```typescript
// In src/core/logger.ts, or override in development
const logger = pino({
  level: 'debug', // More verbose output
  transport: { target: 'pino-pretty' }
});
```

### Log Information Levels
```typescript
logger.trace({ deep: 'object' }, 'Very detailed'); // Level 10
logger.debug({ context }, 'Debug information');     // Level 20
logger.info({ event: 'start' }, 'General info');   // Level 30
logger.warn({ concern }, 'Warning');               // Level 40
logger.error({ err }, 'Error occurred');           // Level 50
logger.fatal({ err }, 'Unrecoverable');           // Level 60
```

### Common Debug Techniques

```typescript
// Check what embed looks like
console.log(embed.toJSON());

// Verify interaction state
console.log('Replied:', interaction.replied);
console.log('Deferred:', interaction.deferred);

// Check cache contents
const value = await redisClient.get('key');
console.log('Cached:', value);

// Monitor database queries
const collection = getDb().collection('guild_configs');
const result = await collection.findOne({ guildId });
console.log('Query result:', result);
```

## 🚀 Performance Optimization

### Caching Strategy
```typescript
// Cache frequently accessed data
const config = await GuildConfigService.getConfig(guildId);
// → Cached for 1 hour
// → Auto-invalidated on updates
// → Falls back to DB if cache misses
```

### Query Optimization
```typescript
// ❌ Fetches ALL guild configs
const allConfigs = await db.collection('guild_configs').find({}).toArray();

// ✅ Efficiently fetches one config
const config = await db.collection('guild_configs').findOne({ guildId });

// ✅ Indexes for faster queries
db.collection('guild_configs').createIndex({ guildId: 1 });
```

### Rate Limiting
```typescript
// Redis-backed spam detection
const key = `spam:${guildId}:${userId}`;
const count = await redisClient.incr(key);
if (count === 1) {
  await redisClient.expire(key, 5); // 5-second window
}
```

## 📋 Commit Message Convention

```bash
git commit -m "feat: add new whitelist command"
git commit -m "fix: resolve database connection timeout"
git commit -m "refactor: improve embed builder structure"
git commit -m "docs: update README with setup instructions"
git commit -m "test: add unit tests for GuildConfigService"
```

## 🔐 Security Checklist

- [ ] All database queries use parameterization (MongoDB prevents injection by default)
- [ ] Commands check permissions before sensitive operations
- [ ] Error messages don't leak system details
- [ ] Sensitive data (tokens) not logged
- [ ] Redis used for short-lived data only
- [ ] No hardcoded secrets in code
- [ ] Input validation on all user inputs
- [ ] Rate limiting prevents abuse

## 📈 Performance Benchmarks

Target metrics for production:
- **Command Response**: < 1 second (with deferral)
- **Database Query**: < 100ms
- **Redis Query**: < 10ms
- **Memory Usage**: < 200MB baseline
- **CPU Usage**: < 10% average

Monitor with `/ping` command.

## 🚨 Error Handling Flowchart

```
User Command
    ↓
Permission Check ❌ → Error Embed (ephemeral)
    ↓ ✅
Defer if Async
    ↓
Execute Command
    ↓
Error? ❌ → Log Error → Error Embed → Did defer? Yes ✅ → followUp / No ❌ → reply
    ↓ ✅
Build Response
    ↓
Send Response (editReply if deferred, else reply)
```

## 🎓 Learning Resources

- **Command Interaction Lifecycle**: Read `src/events/interactionCreate.ts`
- **Embed Styling**: Review `src/ui/embeds/builders.ts`
- **Service Pattern**: Study `src/services/GuildConfigService.ts`
- **Error Handling**: Check error blocks in any command
- **Type Safety**: Review `src/types/database.ts`

## 🤔 Common Questions

**Q: Why defer for some commands?**
A: Discord has a 3-second response deadline. Deferring tells Discord to wait up to 15 minutes for the actual response.

**Q: Why fallbacks in every service?**
A: Network/database failures are inevitable. Graceful degradation prevents cascade failures.

**Q: Why so much logging?**
A: Production debugging is difficult without context. Structured logs help track down issues quickly.

**Q: How do I add dashboard API?**
A: The service layer is designed for this. Add a `rest.ts` file in `src/api/` and create Express routes that call services.

---

Happy coding! 🚀
