# 🚂 Railway Deployment Guide - Pegasus Protocol Bot

## Prerequisites
- GitHub account connected to Railway
- Pegasus Protocol repository pushed to GitHub
- Railway account

## Step 1: Push to GitHub

```bash
cd "c:\Users\ben\CascadeProjects\2048\Pegasus protocol"

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Pegasus Protocol Bot"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/pegasus-protocol-bot.git

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your **pegasus-protocol-bot** repository
5. Railway will automatically detect the configuration

### Option B: Deploy with Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to your project
railway link

# Deploy
railway up
```

## Step 3: Configure Environment Variables

In Railway dashboard, go to your project → **Variables** tab and add:

### Required Variables:
```
TELEGRAM_BOT_TOKEN=8419734178:AAFz-czlYYf9rUCjkypDMLsgoR3ChZkvXzc
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_bot_wallet_private_key
ENCRYPTION_KEY=8cd7e4775b983a0fc1e4f5355cc40e348a26ac25d9d67199f4e8adf8c2b44fe2
```

### Optional Variables:
```
TOKEN_MINT_ADDRESS=your_token_mint_address
CREATOR_WALLET=creator_wallet_address
ADMIN_TELEGRAM_IDS=your_telegram_id
DEV_WALLET_ADDRESS=dev_wallet_for_freeze_protocol
DEV_TOKEN_ACCOUNT=dev_token_account_address
DEV_WALLET_PRIVATE_KEY=dev_wallet_private_key

# Fee Distribution
BUYBACK_PERCENTAGE=70
CREATOR_FEE_PERCENTAGE=20
LOTTERY_PERCENTAGE=10

# Configuration
MIN_HOLDER_TOKENS=1000
PRICE_CHECK_INTERVAL_MINUTES=5
```

## Step 4: Verify Deployment

After deployment:

1. Check Railway logs for:
   ```
   🐴 PEGASUS PROTOCOL BOT STARTING...
   ✅ Loaded existing wallet: [address]
   💰 Wallet balance: X.XXXX SOL
   ✅ Bot ready!
   ```

2. Test the bot on Telegram:
   - Send `/start`
   - Send `/help`
   - Send `/lottery`

## Step 5: Database Persistence

Railway provides ephemeral storage by default. For persistent database:

### Option A: Use Railway's Volume (Recommended)
1. In Railway dashboard → **Settings**
2. Scroll to **Volumes**
3. Click **"New Volume"**
4. Mount path: `/app/data`
5. Update database path in code to use `/app/data/pegasus.db`

### Option B: Use Railway PostgreSQL
1. Add PostgreSQL plugin to your project
2. Railway will auto-inject `DATABASE_URL`
3. Migrate from SQLite to PostgreSQL (optional)

## Troubleshooting

### Bot not starting?
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure `TELEGRAM_BOT_TOKEN` is correct

### Database issues?
- Add a volume for persistence
- Check file permissions
- Verify database path is writable

### Commands not working?
- Check bot logs in Railway
- Verify bot token is valid
- Test with `/start` command first

### Out of memory?
- Upgrade Railway plan
- Optimize database queries
- Check for memory leaks

## Monitoring

View logs in real-time:
```bash
railway logs
```

Or in Railway dashboard → **Deployments** → **View Logs**

## Updating the Bot

```bash
# Make changes locally
git add .
git commit -m "Update bot features"
git push

# Railway will automatically redeploy
```

## Railway Configuration Files

The following files configure Railway deployment:

- `railway.json` - Build and deploy configuration
- `Procfile` - Process type declaration
- `.railwayignore` - Files to exclude from deployment
- `package.json` - Scripts and dependencies

## Important Notes

⚠️ **Security:**
- Never commit `.env` file to GitHub
- Use Railway's environment variables for secrets
- Rotate keys if accidentally exposed

⚠️ **Database:**
- SQLite database is ephemeral without volume
- Add volume for persistence
- Consider PostgreSQL for production

⚠️ **Costs:**
- Railway free tier: $5 credit/month
- Monitor usage in dashboard
- Upgrade plan if needed

## Support

If deployment fails:
1. Check Railway logs
2. Verify all files are committed to GitHub
3. Ensure `package.json` has correct scripts
4. Test build locally: `npm run build && npm start`

---

🐴 **Pegasus Protocol is ready to ascend on Railway!** ✨
