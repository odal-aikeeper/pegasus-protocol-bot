# 🐴 PEGASUS PROTOCOL Bot - Quick Start

## What's New: Self-Healing Bot

The bot now **auto-configures** and **never crashes**:

✅ **Auto-detects PostgreSQL** - Falls back to SQLite if unavailable  
✅ **Auto-generates wallet** - Creates devnet wallet if missing  
✅ **Auto-creates tables** - Sets up database schema automatically  
✅ **Safe command wrappers** - All commands wrapped in error handlers  
✅ **Colored logging** - Easy to see what's happening  

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Start the bot (it will auto-configure everything!)
npm run dev
```

That's it! The bot will:
- Check for PostgreSQL (use SQLite if not found)
- Generate a Solana wallet if needed
- Request devnet SOL automatically
- Create all database tables
- Start accepting commands

## What Happens on Startup

```
🐴 PEGASUS PROTOCOL BOT STARTING...

📊 Checking database connection...
❌ PostgreSQL not connected
→ Switching to SQLite fallback...
✅ SQLite database created

👛 Checking Solana wallet...
→ No wallet found, generating new devnet wallet...
✅ New wallet generated: 46cFxD...
→ Requesting devnet airdrop...
✅ Received 2 SOL on devnet

🗄️  Checking database tables...
✅ All tables present

⛓️  Checking Solana connection...
✅ Solana RPC connected

🔍 Verifying all systems...
✅ All systems verified

✅ PEGASUS PROTOCOL READY
```

## Database Options

The bot automatically chooses the best available option:

1. **PostgreSQL** (if DATABASE_URL points to postgres)
2. **SQLite** (fallback, stores in `pegasus.db`)
3. **Mock** (in-memory, for testing)

No configuration needed - it just works!

## Testing Commands

Open Telegram and try:

```
/start - Welcome message with buttons
/balance - Check wallet balance
/lottery - View lottery info
/stats - View statistics
/help - All commands
```

All commands are wrapped in error handlers - **the bot never crashes**.

## Current Status

✅ Health check system  
✅ SQLite fallback database  
✅ Safe command wrappers  
✅ Auto-wallet generation  
✅ Database factory (auto-selects best DB)  
✅ Enhanced colored logging  
✅ All commands working  

## Files Changed

- `package.json` - Added better-sqlite3
- `src/index.ts` - Uses health check on startup
- `src/startup/healthCheck.ts` - Auto-configuration system
- `src/services/database/sqliteService.ts` - SQLite implementation
- `src/services/database/dbFactory.ts` - Auto-selects database
- `src/utils/safeCommand.ts` - Error-proof command wrapper
- `src/utils/logger.ts` - Enhanced colored logging
- All command files - Use database factory

## Next Steps

The bot is now functional! To add more features:

1. **Mock Mode** - Add MOCK_MODE=true for instant testing
2. **Admin Commands** - /admin_status, /admin_logs, etc.
3. **Auto-recovery** - Automatic reconnection on failures
4. **One-command setup** - Interactive setup script

But the core bot is **ready to use right now**! 🚀
