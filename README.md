# 🐴 PEGASUS PROTOCOL Bot

Professional Telegram bot for automated Solana token buybacks with an integrated lottery reward system.

## 📋 Overview

Pegasus Protocol is a sophisticated Telegram bot that automates token buybacks on the Solana blockchain while rewarding token holders through a lottery system. The bot triggers lotteries at volume milestones (30k, 50k, then every 50k increment), creating an engaging ecosystem for token holders.

## ✨ Features

### 🔄 Automated Buyback System
- **Manual Buybacks**: Execute buybacks instantly via Telegram commands
- **Price-Triggered Buybacks**: Set automatic buybacks when price reaches target levels
- **Jupiter Integration**: Best swap routes via Jupiter DEX aggregator
- **Fee Distribution**: Automatic 70/20/10 split (buyback/creator/lottery)
- **Transaction Tracking**: Full database logging of all buyback transactions

### 🎰 Lottery System
- **Milestone-Based**: Triggers at 30k, 50k, 100k, 150k... (every 50k)
- **Fair Selection**: Cryptographically secure random winner selection
- **Holder Qualification**: Minimum token holding requirement
- **Automatic Payouts**: Winners receive SOL directly to their wallets
- **History Tracking**: Complete lottery winner history

### 📊 Monitoring & Analytics
- **Real-Time Stats**: Track buyback volume, tokens purchased, average price
- **Price Monitoring**: Automated price checks every 5 minutes
- **Milestone Progress**: Visual progress bars and remaining volume
- **Balance Tracking**: Monitor bot wallet SOL balance

### 🔒 Security Features
- **Rate Limiting**: 5 commands per minute per user
- **Input Validation**: Comprehensive validation of all user inputs
- **Error Handling**: Robust error handling with user-friendly messages
- **Transaction Confirmation**: Wait for blockchain confirmation before proceeding
- **Admin Controls**: Admin-only access to sensitive operations

## 🛠️ Tech Stack

- **Node.js** with TypeScript
- **telegraf** - Telegram bot framework
- **@solana/web3.js** - Solana blockchain interaction
- **@solana/spl-token** - Token operations
- **PostgreSQL** with pg - Database
- **axios** - HTTP requests
- **node-cron** - Scheduled tasks
- **winston** - Logging
- **Jupiter API** - DEX aggregation

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Solana wallet with SOL for operations
- Telegram Bot Token (from @BotFather)

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd pegasus-protocol-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up PostgreSQL database**
```bash
# Create database
createdb pegasus

# Or using psql
psql -U postgres
CREATE DATABASE pegasus;
\q
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run database migrations**
```bash
npm run migrate
```

6. **Build the project**
```bash
npm run build
```

7. **Start the bot**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ADMIN_TELEGRAM_ID=your_admin_telegram_id_here

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_base58_encoded_private_key_here
TOKEN_MINT_ADDRESS=your_token_mint_address_here

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/pegasus

# Wallet Addresses
CREATOR_WALLET=creator_wallet_address_here

# Lottery Configuration
MIN_HOLDER_TOKENS=100

# Fee Distribution (must total 100)
BUYBACK_PERCENTAGE=70
CREATOR_FEE_PERCENTAGE=20
LOTTERY_PERCENTAGE=10

# Rate Limiting
MAX_COMMANDS_PER_MINUTE=5

# Monitoring
PRICE_CHECK_INTERVAL_MINUTES=5
```

### Getting Your Bot Token

1. Open Telegram and search for @BotFather
2. Send `/newbot` and follow the instructions
3. Copy the bot token provided
4. Paste it into `TELEGRAM_BOT_TOKEN` in your `.env` file

### Getting Your Admin Telegram ID

1. Open Telegram and search for @userinfobot
2. Send `/start` to the bot
3. Copy your ID
4. Paste it into `ADMIN_TELEGRAM_ID` in your `.env` file

### Solana Wallet Setup

**⚠️ IMPORTANT: Use a dedicated wallet for the bot. Never use your main wallet!**

```bash
# Generate a new keypair
solana-keygen new -o bot-keypair.json

# Get the base58 private key
# Use a tool to convert the JSON keypair to base58 format
# Or use: cat bot-keypair.json | jq -r '.[0:32] | @base64'

# Fund the wallet with SOL
solana transfer <BOT_WALLET_ADDRESS> <AMOUNT> --from <YOUR_WALLET>
```

## 📱 Bot Commands

### User Commands

- `/start` - Welcome message and registration
- `/help` - Display all available commands
- `/balance` - Check bot wallet SOL balance
- `/buyback <amount>` - Execute manual buyback
  - Example: `/buyback 1.5`
- `/auto_buyback <price> <amount>` - Set automated price trigger
  - Example: `/auto_buyback 0.001 2`
- `/lottery` - View current lottery pool and next milestone
- `/lottery_history` - Display past lottery winners
- `/stats` - Show buyback statistics and volume
- `/next_milestone` - Check progress to next milestone
- `/cancel_trigger` - Cancel all your active price triggers

### Admin Commands

All commands are available to the admin specified in `ADMIN_TELEGRAM_ID`.

## 🗄️ Database Schema

### Tables

**users**
- `id` - Primary key
- `telegram_id` - Unique Telegram user ID
- `wallet_address` - Optional linked wallet
- `created_at` - Registration timestamp

**buyback_transactions**
- `id` - Primary key
- `amount_sol` - SOL amount used
- `amount_tokens` - Tokens received
- `price` - Execution price
- `tx_signature` - Solana transaction signature
- `status` - Transaction status
- `created_at` - Execution timestamp

**buyback_volume**
- `id` - Primary key
- `total_volume` - Cumulative buyback volume
- `last_updated` - Last update timestamp

**lottery_milestones**
- `id` - Primary key
- `milestone_amount` - Milestone threshold
- `triggered_at` - Trigger timestamp
- `winner_wallet` - Winner's wallet address
- `payout_amount` - Prize amount
- `payout_tx` - Payout transaction signature

**lottery_pool**
- `id` - Primary key
- `current_amount` - Current pool balance
- `next_milestone` - Next milestone threshold
- `last_updated` - Last update timestamp

**price_triggers**
- `id` - Primary key
- `user_id` - User who created trigger
- `trigger_price` - Target price
- `buyback_amount` - Amount to buyback
- `active` - Trigger status
- `created_at` - Creation timestamp

## 🔄 How It Works

### Buyback Flow

1. User executes buyback command with amount
2. Bot validates balance and amount
3. Splits amount: 70% buyback, 20% creator, 10% lottery
4. Sends creator fee to designated wallet
5. Executes swap via Jupiter API
6. Records transaction in database
7. Updates volume and lottery pool
8. Checks if milestone reached
9. Triggers lottery if milestone hit

### Lottery Flow

1. Volume reaches milestone (30k, 50k, 100k, etc.)
2. Bot fetches all token holders from blockchain
3. Filters holders by minimum token requirement
4. Selects random winner using secure randomization
5. Transfers lottery pool to winner's wallet
6. Records winner in database
7. Announces winner in Telegram
8. Resets pool and sets next milestone

### Price Trigger Flow

1. User sets price trigger with target price and amount
2. Cron job checks price every 5 minutes
3. When price drops to or below target:
   - Notifies user
   - Executes buyback automatically
   - Deactivates trigger
   - Sends confirmation

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive keys
2. **Use dedicated wallet** - Don't use your main wallet for the bot
3. **Secure your server** - Use firewall, SSH keys, and regular updates
4. **Monitor logs** - Check logs regularly for suspicious activity
5. **Backup database** - Regular automated backups
6. **Rate limiting** - Built-in protection against spam
7. **Input validation** - All user inputs are validated
8. **Error handling** - Comprehensive error handling prevents crashes

## 📊 Monitoring

### Logs

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

### Log Levels

- `error` - Critical errors
- `warn` - Warnings
- `info` - General information
- `debug` - Detailed debugging (set LOG_LEVEL=debug)

### Health Checks

Monitor these metrics:
- Bot uptime
- Database connection
- Wallet balance
- Transaction success rate
- Lottery execution

## 🧪 Testing

### Test on Devnet First

Before deploying to mainnet:

1. Change `SOLANA_RPC_URL` to devnet:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
```

2. Use devnet SOL (get from faucet)
3. Test all commands thoroughly
4. Verify transactions on Solana Explorer (devnet)

### Test Checklist

- [ ] Bot starts without errors
- [ ] All commands respond correctly
- [ ] Manual buyback executes successfully
- [ ] Price triggers activate correctly
- [ ] Lottery triggers at milestone
- [ ] Winner selection works
- [ ] Database records all transactions
- [ ] Error handling works properly

## 🚀 Deployment

### Production Deployment

1. **Use a VPS or cloud server** (AWS, DigitalOcean, etc.)
2. **Set up PostgreSQL** on the server
3. **Clone repository** and install dependencies
4. **Configure `.env`** with production values
5. **Run migrations** to set up database
6. **Use PM2** for process management:

```bash
npm install -g pm2
pm2 start dist/index.js --name pegasus-protocol-bot
pm2 save
pm2 startup
```

7. **Set up monitoring** with PM2:
```bash
pm2 monit
```

8. **Configure log rotation**:
```bash
pm2 install pm2-logrotate
```

### Updating

```bash
git pull
npm install
npm run build
pm2 restart pegasus-protocol-bot
```

## 🐛 Troubleshooting

### Bot won't start

- Check `.env` file is configured correctly
- Verify database is running and accessible
- Check bot token is valid
- Review logs in `logs/error.log`

### Transactions failing

- Check wallet has sufficient SOL balance
- Verify RPC endpoint is responsive
- Check Solana network status
- Review transaction logs

### Lottery not triggering

- Verify volume has reached milestone
- Check cron job is running
- Review lottery service logs
- Ensure holders exist and meet minimum requirement

### Database errors

- Check PostgreSQL is running
- Verify connection string in `.env`
- Run migrations if tables are missing
- Check database user permissions

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## ⚠️ Disclaimer

This bot interacts with real cryptocurrency and blockchain transactions. Use at your own risk. Always test thoroughly on devnet before deploying to mainnet. The developers are not responsible for any financial losses.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team
- Check the logs for error details

---

Built with ❤️ for the Solana community

🐴 Ready to ascend? ⬆️✨
