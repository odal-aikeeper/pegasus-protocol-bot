# 📁 Project Structure

```
pegasus-protocol-bot/
├── src/
│   ├── bot/                          # Telegram bot implementation
│   │   ├── commands/                 # Bot command handlers
│   │   │   ├── start.ts             # /start command - user registration
│   │   │   ├── help.ts              # /help command - command guide
│   │   │   ├── buyback.ts           # /buyback command - manual buyback
│   │   │   ├── lottery.ts           # /lottery & /lottery_history commands
│   │   │   ├── stats.ts             # /stats & /balance commands
│   │   │   └── triggers.ts          # /auto_buyback, /cancel_trigger, /next_milestone
│   │   ├── handlers/                # Background handlers
│   │   │   ├── buybackHandler.ts    # Price trigger monitoring
│   │   │   └── lotteryHandler.ts    # Lottery execution handler
│   │   └── index.ts                 # Bot initialization and setup
│   │
│   ├── services/                     # Core business logic
│   │   ├── solana/                  # Solana blockchain services
│   │   │   ├── buybackService.ts    # Buyback execution logic
│   │   │   ├── walletService.ts     # Wallet management
│   │   │   └── holderService.ts     # Token holder queries
│   │   ├── lottery/                 # Lottery system
│   │   │   ├── lotteryService.ts    # Lottery execution
│   │   │   ├── milestoneTracker.ts  # Volume milestone tracking
│   │   │   └── winnerSelector.ts    # Random winner selection
│   │   ├── jupiter/                 # Jupiter DEX integration
│   │   │   ├── jupiterService.ts    # Swap execution via Jupiter
│   │   │   └── priceMonitor.ts      # Token price monitoring
│   │   └── database/                # Database services
│   │       ├── dbService.ts         # Database operations
│   │       └── migrations/          # Database migrations
│   │           ├── schema.sql       # Database schema
│   │           └── run.ts           # Migration runner
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── bot.types.ts             # Bot-related types
│   │   ├── buyback.types.ts         # Buyback-related types
│   │   └── lottery.types.ts         # Lottery-related types
│   │
│   ├── config/                       # Configuration
│   │   └── config.ts                # Environment configuration
│   │
│   ├── utils/                        # Utility functions
│   │   ├── logger.ts                # Winston logger setup
│   │   └── validation.ts            # Input validation utilities
│   │
│   └── index.ts                      # Application entry point
│
├── logs/                             # Log files (auto-generated)
│   ├── combined.log                 # All logs
│   └── error.log                    # Error logs only
│
├── dist/                             # Compiled JavaScript (auto-generated)
│
├── node_modules/                     # Dependencies (auto-generated)
│
├── .env                              # Environment variables (create from .env.example)
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore rules
├── package.json                      # Project dependencies
├── tsconfig.json                     # TypeScript configuration
├── README.md                         # Main documentation
├── SETUP_GUIDE.md                    # Quick setup guide
└── PROJECT_STRUCTURE.md              # This file
```

## 🔍 File Descriptions

### Entry Point
- **`src/index.ts`** - Main application entry, starts bot and cron jobs

### Bot Layer
- **`src/bot/index.ts`** - Bot initialization, middleware, command registration
- **`src/bot/commands/*.ts`** - Individual command implementations
- **`src/bot/handlers/*.ts`** - Background task handlers (price checks, lottery)

### Service Layer
- **`src/services/solana/*`** - Solana blockchain interactions
- **`src/services/lottery/*`** - Lottery system logic
- **`src/services/jupiter/*`** - DEX integration and price monitoring
- **`src/services/database/*`** - Database operations and migrations

### Configuration & Utils
- **`src/config/config.ts`** - Centralized configuration from environment
- **`src/utils/logger.ts`** - Structured logging with Winston
- **`src/utils/validation.ts`** - Input validation and formatting

### Type Definitions
- **`src/types/*.ts`** - TypeScript interfaces and types

## 🔄 Data Flow

### Buyback Flow
```
User Command → Bot Command Handler → Buyback Service → Jupiter Service → Solana Blockchain
                                   ↓
                            Database Service → PostgreSQL
                                   ↓
                            Milestone Tracker → Lottery Service (if milestone reached)
```

### Price Trigger Flow
```
Cron Job (every 5 min) → Buyback Handler → Price Monitor → Jupiter API
                                         ↓
                                   Check Triggers → Execute Buyback (if triggered)
                                         ↓
                                   Notify User via Telegram
```

### Lottery Flow
```
Milestone Reached → Lottery Handler → Holder Service → Solana RPC (fetch holders)
                                   ↓
                            Winner Selector → Random Selection
                                   ↓
                            Lottery Service → Transfer SOL to Winner
                                   ↓
                            Database Service → Record Winner
                                   ↓
                            Telegram Notification → Announce Winner
```

## 📊 Database Tables

### Core Tables
- **users** - Telegram user registrations
- **buyback_transactions** - All buyback records
- **buyback_volume** - Cumulative volume tracking
- **lottery_milestones** - Lottery trigger history
- **lottery_pool** - Current lottery state
- **price_triggers** - User-created price triggers

## 🔧 Key Components

### Services
1. **WalletService** - Manages bot's Solana wallet
2. **BuybackService** - Executes token buybacks
3. **JupiterService** - Interacts with Jupiter DEX
4. **LotteryService** - Handles lottery execution
5. **HolderService** - Queries token holders
6. **DatabaseService** - All database operations

### Handlers
1. **BuybackHandler** - Monitors and executes price triggers
2. **LotteryHandler** - Checks and executes lottery milestones

### Bot Commands
- User commands: start, help, balance, buyback, lottery, stats
- Trigger commands: auto_buyback, cancel_trigger, next_milestone
- History commands: lottery_history

## 🚀 Execution Flow

1. **Startup** (`src/index.ts`)
   - Load configuration
   - Initialize database connection
   - Start Telegram bot
   - Schedule cron jobs

2. **Command Handling** (`src/bot/index.ts`)
   - Receive Telegram message
   - Apply rate limiting
   - Route to command handler
   - Execute command logic
   - Return response to user

3. **Background Tasks** (Cron Jobs)
   - Price trigger checks (every 5 minutes)
   - Lottery milestone checks (every 10 minutes)

4. **Database Operations**
   - Record all transactions
   - Track volume and milestones
   - Store user data and triggers

## 📝 Configuration Files

- **`.env`** - Runtime environment variables (secrets)
- **`tsconfig.json`** - TypeScript compiler options
- **`package.json`** - Dependencies and scripts

## 🔒 Security Features

- Rate limiting per user
- Input validation on all commands
- Secure random number generation for lottery
- Transaction confirmation before proceeding
- Error handling with user-friendly messages
- Comprehensive logging for auditing

## 📈 Monitoring Points

- Bot uptime and health
- Transaction success/failure rates
- Wallet balance levels
- Database connection status
- Cron job execution
- Error log monitoring

---

This structure provides a clean separation of concerns with:
- **Bot layer** for user interaction
- **Service layer** for business logic
- **Database layer** for persistence
- **Utility layer** for common functions
