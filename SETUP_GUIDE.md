# 🚀 Quick Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

```bash
cd pegasus-protocol-bot
npm install
```

### 2. Set Up PostgreSQL Database

**Option A: Using psql**
```bash
psql -U postgres
CREATE DATABASE pegasus;
\q
```

**Option B: Using command line**
```bash
createdb pegasus
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in these required values:

```env
# Get from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Get from @userinfobot on Telegram
ADMIN_TELEGRAM_ID=123456789

# Solana RPC (use devnet for testing)
SOLANA_RPC_URL=https://api.devnet.solana.com

# Your bot wallet private key (base58 encoded)
SOLANA_PRIVATE_KEY=your_base58_private_key_here

# Your token's mint address
TOKEN_MINT_ADDRESS=TokenMintAddress111111111111111111111111

# PostgreSQL connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/pegasus

# Creator wallet for fees
CREATOR_WALLET=CreatorWalletAddress1111111111111111111111
```

### 4. Generate Solana Wallet

**⚠️ Create a NEW wallet for the bot - never use your main wallet!**

```bash
# Install Solana CLI if not installed
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate new keypair
solana-keygen new -o bot-keypair.json

# View the public key
solana-keygen pubkey bot-keypair.json

# Convert to base58 for .env (you'll need a conversion tool)
# Or use online tools to convert the JSON array to base58
```

**Fund the wallet:**
```bash
# For devnet (testing)
solana airdrop 2 <YOUR_BOT_WALLET_ADDRESS> --url devnet

# For mainnet (production)
solana transfer <YOUR_BOT_WALLET_ADDRESS> 1 --from <YOUR_MAIN_WALLET>
```

### 5. Run Database Migrations

```bash
npm run migrate
```

You should see:
```
✅ Database migrations completed successfully!
```

### 6. Build the Project

```bash
npm run build
```

### 7. Start the Bot

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
🐴 PEGASUS PROTOCOL Bot started successfully!
Bot username: @YourBotName
🚀 PEGASUS PROTOCOL Bot is now running!
```

## Testing the Bot

### 1. Open Telegram

Search for your bot by username (the one you set with @BotFather)

### 2. Test Basic Commands

```
/start
/help
/balance
/lottery
/stats
```

### 3. Test Buyback (on devnet!)

```
/buyback 0.1
```

This will execute a test buyback with 0.1 SOL.

### 4. Test Price Trigger

```
/auto_buyback 0.001 0.5
```

This sets a trigger to buyback 0.5 SOL when price drops to 0.001.

### 5. Check Milestone Progress

```
/next_milestone
```

## Common Issues

### "Cannot find module" errors

Run `npm install` again to ensure all dependencies are installed.

### Database connection failed

- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Ensure database exists: `psql -l | grep pegasus`

### Bot won't start

- Verify TELEGRAM_BOT_TOKEN is correct
- Check all required .env variables are set
- Review logs in `logs/error.log`

### Insufficient balance errors

- Check bot wallet has SOL: `solana balance <WALLET_ADDRESS>`
- Fund the wallet with more SOL

### RPC errors

- Try a different RPC endpoint
- For devnet: `https://api.devnet.solana.com`
- For mainnet: Use a paid RPC like Helius or QuickNode

## Production Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start bot with PM2
pm2 start dist/index.js --name pegasus-protocol-bot

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup

# Monitor the bot
pm2 monit

# View logs
pm2 logs pegasus-protocol-bot
```

### Using systemd (Linux)

Create `/etc/systemd/system/pegasus-protocol-bot.service`:

```ini
[Unit]
Description=Pegasus Protocol Telegram Bot
After=network.target postgresql.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/pegasus-protocol-bot
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable pegasus-protocol-bot
sudo systemctl start pegasus-protocol-bot
sudo systemctl status pegasus-protocol-bot
```

## Security Checklist

- [ ] Using dedicated wallet (not main wallet)
- [ ] `.env` file is not committed to git
- [ ] Database has strong password
- [ ] Server has firewall enabled
- [ ] SSH uses key authentication (not password)
- [ ] Regular backups configured
- [ ] Logs are monitored
- [ ] Bot tested thoroughly on devnet first

## Monitoring

### Check Bot Status
```bash
pm2 status pegasus-protocol-bot
```

### View Logs
```bash
pm2 logs pegasus-protocol-bot --lines 100
```

### Check Database
```bash
psql -d pegasus -c "SELECT COUNT(*) FROM buyback_transactions;"
psql -d pegasus -c "SELECT * FROM lottery_pool;"
```

### Check Wallet Balance
```bash
solana balance <BOT_WALLET_ADDRESS>
```

## Backup

### Database Backup
```bash
pg_dump pegasus > pegasus_backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql pegasus < pegasus_backup_20240101.sql
```

## Support

If you encounter issues:

1. Check the logs: `logs/error.log`
2. Verify all environment variables
3. Test on devnet first
4. Review the README.md for detailed documentation

---

Ready to ascend! 🐴✨
