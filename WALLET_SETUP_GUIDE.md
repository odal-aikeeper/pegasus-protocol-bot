# 🐴 Pegasus Protocol - Wallet Management & Transaction System

## ✅ IMPLEMENTED FEATURES

### 1. **Secure Wallet Linking**
Users can link their Solana wallets to execute buybacks from their own funds.

**Commands:**
- `/link_wallet` - Link your Solana wallet (private key encrypted & stored)
- `/my_wallet` - View your linked wallet address
- `/unlink_wallet` - Remove your linked wallet

**Security Features:**
- ✅ Private keys encrypted with AES-256-CBC before storage
- ✅ Messages containing private keys auto-deleted
- ✅ Security warnings shown to users
- ✅ Encryption key stored in `.env` (never committed to git)

### 2. **Real Transaction Execution**
Buybacks execute REAL swaps on Solana using Jupiter aggregator.

**How it works:**
1. User runs `/buyback 1.5` (amount in SOL)
2. Bot fetches quote from Jupiter API
3. Shows confirmation with estimated tokens & fees
4. User confirms
5. Bot decrypts user's wallet
6. Executes swap using user's wallet
7. Updates volume & lottery pool
8. Checks if lottery milestone reached

**Fee Distribution:**
- 70% - Token buyback
- 20% - Creator wallet
- 10% - Lottery pool

### 3. **Lottery System**
Automatic lottery execution when volume milestones are hit.

**How it works:**
1. Every buyback adds 10% to lottery pool
2. When total volume hits milestone (30,000 SOL default)
3. Bot queries all token holders from Solana blockchain
4. Filters by minimum token balance (1,000 tokens default)
5. Randomly selects winner
6. Sends lottery pool SOL from BOT wallet (not user wallets)
7. Announces winner to all users
8. Resets pool and increases next milestone

### 4. **Jupiter Swap Integration**
Real DEX aggregation for best swap prices.

**Features:**
- ✅ Quote fetching from Jupiter API
- ✅ Transaction building & signing
- ✅ Slippage protection (50 bps default)
- ✅ Auto compute unit limits
- ✅ Priority fees for faster execution

## 🔧 SETUP INSTRUCTIONS

### Step 1: Environment Variables

Add to your `.env` file:

```bash
# CRITICAL: Generate encryption key for user wallet security
ENCRYPTION_KEY=8cd7e4775b983a0fc1e4f5355cc40e348a26ac25d9d67199f4e8adf8c2b44fe2

# Token to buy (replace with your token mint address)
TOKEN_MINT_ADDRESS=YourTokenMintAddressHere

# Minimum tokens to be eligible for lottery
MIN_HOLDER_TOKENS=1000

# Use devnet for testing
SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Generate your own encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Database Schema

The database automatically creates these tables on startup:
- `users` - Now includes `wallet_address` and `wallet_private_key_encrypted`
- `buyback_volume` - Tracks total volume
- `lottery_pool` - Current pool amount and next milestone
- `lottery_winners` - Historical lottery winners
- `buyback_transactions` - All buyback transactions

### Step 3: Bot Wallet Setup

The bot wallet (from `SOLANA_PRIVATE_KEY` in `.env`) is used to:
- Pay lottery rewards to winners
- NOT used for user buybacks (users use their own wallets)

Make sure bot wallet has SOL for lottery payouts!

## 📱 USER FLOW

### Linking a Wallet

1. User: `/link_wallet`
2. Bot: Shows security warning
3. User: Sends private key (base58 format)
4. Bot: Encrypts key, stores in DB, deletes message
5. Bot: Confirms with wallet address

### Executing a Buyback

1. User: `/buyback 1.5`
2. Bot: Checks if wallet linked
3. Bot: Gets Jupiter quote
4. Bot: Shows confirmation with fees
5. User: Clicks "✅ Confirm"
6. Bot: Decrypts wallet, executes swap
7. Bot: Updates volume & lottery pool
8. Bot: Checks if lottery should execute
9. Bot: Shows success with transaction link

### Lottery Execution (Automatic)

1. Volume hits milestone (e.g., 30,000 SOL)
2. Bot queries Solana for all token holders
3. Bot filters by minimum balance
4. Bot randomly selects winner
5. Bot sends SOL from bot wallet to winner
6. Bot announces winner to all users
7. Pool resets, milestone increases

## 🧪 TESTING ON DEVNET

### Prerequisites

1. Set `SOLANA_RPC_URL=https://api.devnet.solana.com`
2. Use devnet SOL (get from https://faucet.solana.com)
3. Use a devnet token for `TOKEN_MINT_ADDRESS`

### Test Flow

1. **Link Wallet:**
   ```
   /link_wallet
   [Send your devnet wallet private key]
   ```

2. **Check Balance:**
   ```
   /balance
   ```

3. **Execute Test Buyback:**
   ```
   /buyback 0.1
   [Confirm transaction]
   ```

4. **Check Stats:**
   ```
   /stats
   /lottery
   ```

## 🔒 SECURITY NOTES

### ✅ What's Secure:
- Private keys encrypted with AES-256-CBC
- Encryption key stored in `.env` (gitignored)
- Messages containing keys auto-deleted
- Users warned about security

### ⚠️ Important:
- This is for DEVNET TESTING only
- For production, consider hardware wallet integration
- Never share encryption keys
- Regularly backup database (contains encrypted keys)
- Use strong encryption keys (32 bytes random)

## 📊 AVAILABLE COMMANDS

### Wallet Management
- `/link_wallet` - Link your Solana wallet
- `/my_wallet` - View linked wallet
- `/unlink_wallet` - Remove wallet
- `/balance` - Check SOL balance

### Trading
- `/buyback <amount>` - Execute buyback (e.g., `/buyback 1.5`)

### Information
- `/start` - Welcome message
- `/help` - Command list
- `/lottery` - Lottery info & progress
- `/stats` - Volume & lottery statistics

## 🎯 NEXT STEPS

1. **Test wallet linking** with a devnet wallet
2. **Execute small test buyback** (0.1 SOL)
3. **Verify transaction** on Solscan
4. **Check database** to confirm volume updated
5. **Test lottery** by reaching milestone

## 🐛 TROUBLESHOOTING

**"No wallet linked"**
- Run `/link_wallet` first
- Make sure you sent a valid base58 private key

**"Failed to get quote"**
- Check `TOKEN_MINT_ADDRESS` is valid
- Ensure token has liquidity on Jupiter
- Try smaller amount

**"Swap failed"**
- Check wallet has enough SOL
- Verify RPC URL is accessible
- Check slippage tolerance

**"Encryption key warning"**
- Add `ENCRYPTION_KEY` to `.env`
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 📝 DATABASE QUERIES

**Check linked wallets:**
```sql
SELECT telegram_id, username, wallet_address FROM users WHERE wallet_address IS NOT NULL;
```

**Check lottery pool:**
```sql
SELECT * FROM lottery_pool WHERE id = 1;
```

**Check total volume:**
```sql
SELECT * FROM buyback_volume WHERE id = 1;
```

**Check recent transactions:**
```sql
SELECT * FROM buyback_transactions ORDER BY created_at DESC LIMIT 10;
```

---

**Pegasus Protocol is now FULLY FUNCTIONAL with real transaction execution!** 🐴✨
