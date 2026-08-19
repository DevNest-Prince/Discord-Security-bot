# ⚡ Quick Command Reference

## 🎯 Slash Commands Overview

All commands support Discord's 3-second response guarantee through intelligent deferral.

---

## 📊 `/ping`
**Purpose**: Monitor system health and latency

**Usage**: `/ping`

**Response**:
```
🤖 System Operational
───────────────────────
🏓 Bot Latency:      45ms
📡 WebSocket:        45ms
💾 MongoDB:          12ms
⚡ Redis:            3ms
```

**What It Checks**:
- Discord WebSocket connection latency
- MongoDB database response time
- Redis cache response time

---

## 🏛️ `/serverinfo`
**Purpose**: Display comprehensive guild statistics

**Usage**: `/serverinfo`

**Response**:
```
📌 Prinex Guild | Server Information
────────────────────────────────────
🆔 Server ID:        123456789
👑 Owner:            @Owner#0000
👥 Members:          250
💬 Channels:         45
🎭 Roles:            32
📅 Created On:       Jan 1, 2021 (3 years ago)
🚀 Boost Status:     Level 3 (15 Boosts)
```

**Information Displayed**:
- Server ID (copy-able)
- Owner mention
- Total member count
- Channel count
- Role count
- Creation date (with relative time)
- Boost level and count
- Server icon

---

## 👤 `/userinfo [user]`
**Purpose**: Display detailed user profile

**Usage**:
- `/userinfo` → Your own profile
- `/userinfo @username` → Another user

**Response**:
```
👤 Username | User Information
────────────────────────────────
🆔 User ID:           987654321
📅 Account Created:   Jan 15, 2020 (4 years ago)
📥 Joined Server:     Mar 10, 2023 (2 years ago)
🎭 Roles:             @Developer @Member @Contributor
```

**Information Displayed**:
- User ID
- Account creation (absolute + relative)
- Server join date (if member)
- All roles (excludes @everyone)
- User's avatar
- Bot account indicator

---

## ❓ `/help`
**Purpose**: Display interactive help menu

**Usage**: `/help`

**Response**:
```
🤖 Prinex | Help Menu
─────────────────────
Welcome to Prinex Security Bot!
Use `p!` for prefix or `/` for slash.

⚙️ UTILITY COMMANDS
`/ping` — Check latency
`/serverinfo` — Display server info
`/userinfo` — Get user profile
`/help` — Display this menu

🛡️ SECURITY & MODERATION
`/whitelist` — Manage whitelists

⏳ COMING SOON
`anti-spam` — Advanced detection
`logging` — Audit trail
`anti-nuke` — Anti-deletion

💡 Use /help for detailed info...
```

**Features**:
- Categorized commands
- Upcoming features preview
- Quick usage tips

---

## 🛡️ `/whitelist` (ADMIN ONLY)
**Requires**: Administrator permission

### `/whitelist view`
**Purpose**: List all whitelisted items

**Usage**: `/whitelist view`

**Response**:
```
✨ Automod Whitelist
────────────────────
🎭 Whitelisted Roles (2)
@Moderator (@123)
@Bot-Protected (@456)

👤 Whitelisted Users (3)
Admin#0001 (@789)
ServiceBot (@012)
Trusted#1234 (@345)

💬 Whitelisted Channels (1)
#bot-spam (#678)

📁 Whitelisted Categories (0)
None
```

**Auto-Features**:
- Counts for each type
- Automatically removes deleted items
- Shows items with their Discord mentions/IDs

---

### `/whitelist add <type> <target>`
**Purpose**: Add item to whitelist

**Subcommand**: `add`

**Parameters**:
- `type`: `role` / `user` / `channel` / `category`
- `target`: Mention or ID

**Usage Examples**:
```
/whitelist add role @Moderator
/whitelist add user @JohnDoe
/whitelist add channel #general
/whitelist add category CategoryID
```

**Response**:
```
✅ Whitelist Updated
────────────────────
Moderator (@123) has been **added** to the 
role whitelist. They will no longer trigger 
spam detection.
```

**Error Cases**:
```
❌ Could not find role. Use valid ID or mention.
❌ Moderator is already in the role whitelist.
```

---

### `/whitelist remove <type> <target>`
**Purpose**: Remove item from whitelist

**Subcommand**: `remove`

**Parameters**:
- `type`: `role` / `user` / `channel` / `category`
- `target`: Mention or ID

**Usage Examples**:
```
/whitelist remove role @Moderator
/whitelist remove user @JohnDoe
/whitelist remove channel #general
/whitelist remove category CategoryID
```

**Response**:
```
✅ Whitelist Updated
────────────────────
JohnDoe (@789) has been **removed** from the 
user whitelist. They will now be subject to 
spam detection.
```

---

## 📝 Prefix Commands (Alternative)

All commands work with prefix `p!` (configurable):

```
p!ping              ← System health
p!serverinfo        ← Guild stats
p!userinfo @user    ← User profile
p!help              ← Help menu
p!whitelist         ← Whitelist management
```

**Aliases**:
- `p!ping` / `p!latency`
- `p!serverinfo` / `p!server` / `p!guildinfo`
- `p!userinfo` / `p!user` / `p!whois`
- `p!help` / `p!commands` / `p!menu`
- `p!whitelist` / `p!wl`

---

## 🔄 Spam Detection Whitelist Behavior

When spam detection is active (3+ messages per 5 seconds):

### ✅ These Are Whitelisted (No spam action taken):
- Users in `whitelistedMembers`
- Users with roles in `whitelistedRoles`
- Messages in `whitelistedChannels`
- Messages in categories with `whitelistedCategories`

### ❌ These Get Action Taken:
- Regular users spamming
- Users not in any whitelist

### 🧹 Auto-Cleanup:
If a role/channel is deleted but still in whitelist:
- System automatically removes it next scan
- No manual cleanup needed
- Prevents cascade failures

---

## 🎛️ Permission Requirements

| Command | Permission | Details |
|---------|-----------|---------|
| `/ping` | None | Everyone can use |
| `/serverinfo` | None | Everyone can use |
| `/userinfo` | None | Everyone can use |
| `/help` | None | Everyone can use |
| `/whitelist` | **Admin** | Server administrators only |

---

## ⚡ Response Guarantees

All commands respond within Discord's 3-second deadline through:

**Fast Commands** (< 1 second):
- `/ping`
- `/help`
- `/whitelist view`

**Deferred Commands** (up to 3 seconds, then deferred response):
- `/serverinfo` (fetches owner)
- `/userinfo` (fetches member)
- `/whitelist add` (database write)
- `/whitelist remove` (database write)

---

## 🎨 Embed Styling

### Color Scheme
- 🟦 **Blue**: General information (`/serverinfo`, `/userinfo`)
- 🟩 **Green**: Success messages (`/whitelist add`)
- 🟪 **Purple**: Security features (`/whitelist view`)
- 🟨 **Yellow**: Warnings and confirmations
- 🟥 **Red**: Errors and failures

### Icons Used
- ✅ Success messages
- ❌ Error messages
- ⚠️ Warnings
- ℹ️ Information
- 🛡️ Security features
- ⚙️ Utility features
- 🤖 Bot-related
- 🏓 Latency/ping

---

## 🚨 Common Issues

### Bot Not Responding?
1. Verify bot has "Send Messages" permission
2. Run `/help` to confirm bot is online
3. Check if command was registered: `/ping` should work

### Whitelist Not Working?
1. Run `/whitelist view` to verify entry exists
2. Use `/userinfo @user` to check their roles
3. Admin-only: requires Administrator permission

### Permission Denied?
```
❌ You need Administrator permission to use this command!
```
Only server admins can use `/whitelist` commands.

### Mention Recognition Issues?
Both formats work:
- ✅ `/whitelist add role @Moderator`
- ✅ `/whitelist add role 123456789`

---

## 📊 Example Workflows

### Scenario 1: Set Up Moderation Bypass
```
1. /whitelist add role @Moderators       ← Mods bypass spam
2. /whitelist add role @Bots              ← Bots bypass spam
3. /whitelist add channel #general        ← General is exempt
4. /whitelist view                        ← Verify setup
```

### Scenario 2: Debug User Issue
```
1. /userinfo @UserInQuestion              ← Check roles
2. /whitelist view                        ← Check if whitelisted
3. /ping                                  ← Verify system health
```

### Scenario 3: Remove Misbehaving User
```
1. /whitelist add user @CasualSpammer     ← Whitelist them temporarily
2. [Issue resolved / user warned]
3. /whitelist remove user @CasualSpammer  ← Remove from whitelist
```

---

## 🔗 Related Documentation

- **Full Setup**: See `README.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Development**: See `DEVELOPMENT.md`

---

**Last Updated**: 2024
**Bot Version**: 1.0.0
