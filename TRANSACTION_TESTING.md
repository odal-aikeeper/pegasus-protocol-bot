# 🐴 Pegasus Protocol - Transaction Testing Guide

## ⚠️ CRITICAL: ALWAYS TEST ON DEVNET FIRST

Never test with real funds on mainnet until thoroughly tested on devnet.

## Prerequisites

### 1. Environment Setup

Ensure your `.env` file is configured for **DEVNET**:

```env
# DEVNET Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
TOKEN_MINT_ADDRESS=<your_devnet_token_address>
CREATOR_WALLET=<devnet_creator_wallet>
ENCRYPTION_KEY=<32_char_hex_key>

# Bot Configuration
TELEGRAM_BOT_TOKEN=<your_bot_token>
ADMIN_TELEGRAM_ID=<your_telegram_id>

# Fee Distribution (must total 100)
BUYBACK_PERCENTAGE=70
CREATOR_FEE_PERCENTAGE=20
LOTTERY_PERCENTAGE=10

# Lottery Settings
MIN_HOLDER_TOKENS=1000
```

### 2. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Create Test Wallets

You'll need:
- **User wallet** - For testing buybacks
- **Creator wallet** - To receive creator fees
- **Bot wallet** - For lottery payouts

```bash
# Generate wallets
solana-keygen new -o user-wallet.json
solana-keygen new -o creator-wallet.json
solana-keygen new -o bot-wallet.json

# Get addresses
solana-keygen pubkey user-wallet.json
solana-keygen pubkey creator-wallet.json
solana-keygen pubkey bot-wallet.json

# Fund with devnet SOL
solana airdrop 5 <user_wallet_address> --url devnet
solana airdrop 2 <creator_wallet_address> --url devnet
solana airdrop 5 <bot_wallet_address> --url devnet
```

## Testing Checklist

### Phase 1: Wallet Security ✅

**Test 1: Wallet Linking**
```
1. Start bot: /start
2. Link wallet: /link_wallet
3. Send your devnet wallet private key (base58 format)
4. Verify: Message with key is deleted
5. Verify: Success message shows shortened address
6. Check: /my_wallet shows correct address
```

**Expected Results:**
- ✅ Private key message deleted immediately
- ✅ Wallet address stored in database
- ✅ Private key encrypted in database
- ✅ Success message with shortened address

**Test 2: Encryption/Decryption**
```
1. Link wallet
2. Execute a buyback (tests decryption)
3. Verify transaction executes successfully
```

**Expected Results:**
- ✅ Private key decrypts correctly
- ✅ Transaction signs successfully
- ✅ No encryption errors in logs

### Phase 2: Balance Checking ✅

**Test 3: Insufficient Balance**
```
1. Link wallet with 0.1 SOL
2. Try: /buyback 1.0
3. Verify error message
```

**Expected Results:**
- ✅ Error: "Insufficient Balance"
- ✅ Shows current balance
- ✅ Shows required amount
- ✅ No transaction executed

**Test 4: Sufficient Balance**
```
1. Fund wallet with 5 SOL
2. Check: /balance
3. Verify balance shows correctly
```

**Expected Results:**
- ✅ Balance displays correctly
- ✅ Wallet address shown (shortened)
- ✅ Action buttons appear

### Phase 3: Fee Distribution ✅

**Test 5: Fee Calculation**
```
1. Execute: /buyback 1.0
2. Verify confirmation shows:
   - Buyback: 0.7 SOL (70%)
   - Creator: 0.2 SOL (20%)
   - Lottery: 0.1 SOL (10%)
```

**Expected Results:**
- ✅ Fees total exactly 1.0 SOL
- ✅ Percentages match configuration
- ✅ All amounts displayed correctly

**Test 6: Creator Fee Transfer**
```
1. Check creator wallet balance before
2. Execute: /buyback 1.0
3. Confirm transaction
4. Check creator wallet balance after
5. Verify increase of 0.2 SOL
```

**Expected Results:**
- ✅ Creator receives exactly 20% of amount
- ✅ Transaction signature provided
- ✅ Transaction visible on Solscan devnet

**Test 7: Lottery Pool Update**
```
1. Check lottery pool: /lottery
2. Note current pool amount
3. Execute: /buyback 1.0
4. Check lottery pool again
5. Verify increase of 0.1 SOL
```

**Expected Results:**
- ✅ Pool increases by 10% of buyback amount
- ✅ Database updated correctly
- ✅ Progress bar updates

### Phase 4: Jupiter Swap Execution ✅

**Test 8: Swap Quote**
```
1. Execute: /buyback 0.5
2. Verify quote shows:
   - Estimated tokens
   - Price per token
   - Price impact
```

**Expected Results:**
- ✅ Quote fetched from Jupiter
- ✅ Token amount estimated
- ✅ Price impact shown
- ✅ Confirmation buttons appear

**Test 9: Swap Execution**
```
1. Execute: /buyback 0.5
2. Click "✅ Confirm"
3. Wait for execution
4. Check transaction on Solscan
```

**Expected Results:**
- ✅ Swap executes successfully
- ✅ Tokens received in wallet
- ✅ Transaction confirmed on-chain
- ✅ Success message with TX link

**Test 10: Swap Failure Handling**
```
1. Try buyback with very high slippage token
2. Verify error handling
```

**Expected Results:**
- ✅ Error message displayed
- ✅ Funds remain safe
- ✅ Clear error explanation
- ✅ No partial transactions

### Phase 5: Database Updates ✅

**Test 11: Transaction Recording**
```
1. Execute buyback
2. Check database:
   SELECT * FROM buyback_transactions ORDER BY created_at DESC LIMIT 1;
```

**Expected Results:**
- ✅ Transaction recorded with signature
- ✅ Amount stored correctly
- ✅ Timestamp accurate

**Test 12: Volume Tracking**
```
1. Check: /stats (note volume)
2. Execute: /buyback 1.0
3. Check: /stats again
4. Verify volume increased by 1.0
```

**Expected Results:**
- ✅ Total volume increases correctly
- ✅ Transaction count increases
- ✅ Stats display accurately

### Phase 6: Lottery System ✅

**Test 13: Milestone Progress**
```
1. Check: /next_milestone
2. Note remaining volume
3. Execute buybacks to approach milestone
4. Monitor progress bar
```

**Expected Results:**
- ✅ Progress updates after each buyback
- ✅ Progress bar displays correctly
- ✅ Remaining amount accurate

**Test 14: Lottery Trigger**
```
1. Execute buybacks to reach milestone
2. Wait 2 seconds after last buyback
3. Check for lottery announcement
```

**Expected Results:**
- ✅ Lottery executes automatically
- ✅ Winner selected randomly
- ✅ Winner announcement sent to all users
- ✅ Pool resets to 0
- ✅ Next milestone increases

**Test 15: Winner Payout**
```
1. Trigger lottery
2. Check winner's wallet balance
3. Verify SOL received
4. Check transaction on Solscan
```

**Expected Results:**
- ✅ Winner receives full pool amount
- ✅ Payout from bot wallet
- ✅ Transaction confirmed
- ✅ Database records winner

**Test 16: Holder Eligibility**
```
1. Create wallets with varying token amounts
2. Trigger lottery
3. Verify only holders with MIN_HOLDER_TOKENS eligible
```

**Expected Results:**
- ✅ Only qualified holders included
- ✅ Minimum balance enforced
- ✅ Random selection fair

### Phase 7: Error Handling ✅

**Test 17: Network Errors**
```
1. Temporarily disconnect internet
2. Try: /buyback 1.0
3. Verify error handling
```

**Expected Results:**
- ✅ Clear error message
- ✅ No funds lost
- ✅ User can retry

**Test 18: Invalid Inputs**
```
1. Try: /buyback abc
2. Try: /buyback -1
3. Try: /buyback 0
```

**Expected Results:**
- ✅ Validation errors shown
- ✅ No transactions attempted
- ✅ Clear instructions provided

**Test 19: Wallet Not Linked**
```
1. Unlink wallet: /unlink_wallet
2. Try: /buyback 1.0
3. Verify error message
```

**Expected Results:**
- ✅ Error: "No Wallet Linked"
- ✅ Instructions to link wallet
- ✅ No transaction attempted

### Phase 8: Security Testing ✅

**Test 20: Private Key Security**
```
1. Link wallet
2. Check database directly
3. Verify key is encrypted
4. Try to decrypt manually
```

**Expected Results:**
- ✅ Private key not readable in database
- ✅ Encryption uses AES-256-CBC
- ✅ IV unique per encryption
- ✅ Decryption only possible with ENCRYPTION_KEY

**Test 21: Message Deletion**
```
1. Link wallet
2. Send private key
3. Check Telegram chat
4. Verify message deleted
```

**Expected Results:**
- ✅ Private key message deleted within 1 second
- ✅ No trace of key in chat history
- ✅ Success message remains

**Test 22: Transaction Confirmation**
```
1. Execute buyback
2. Try to execute same transaction twice
3. Verify protection against double-spend
```

**Expected Results:**
- ✅ Each transaction unique
- ✅ No duplicate transactions
- ✅ Proper nonce handling

## Performance Testing

### Test 23: Concurrent Buybacks
```
1. Have 3 users execute buybacks simultaneously
2. Monitor database updates
3. Verify all transactions process correctly
```

**Expected Results:**
- ✅ All transactions complete
- ✅ No database conflicts
- ✅ Volume updates correctly

### Test 24: Large Amounts
```
1. Test with 10 SOL buyback
2. Test with 0.01 SOL buyback
3. Verify both work correctly
```

**Expected Results:**
- ✅ Large amounts process correctly
- ✅ Small amounts process correctly
- ✅ Fee calculations accurate for all sizes

## Mainnet Migration Checklist

Before deploying to mainnet:

- [ ] All devnet tests pass
- [ ] Encryption key is production-grade (32 random bytes)
- [ ] Creator wallet is correct mainnet address
- [ ] Bot wallet funded with SOL for lottery payouts
- [ ] Token mint address is mainnet token
- [ ] RPC URL changed to mainnet
- [ ] Database backed up
- [ ] Admin controls tested
- [ ] Rate limiting verified
- [ ] Error logging configured
- [ ] Monitoring set up

## Emergency Procedures

### If Transaction Fails:
1. Check Solscan for transaction status
2. Verify user's wallet balance
3. Check bot logs for errors
4. If funds stuck, contact Solana support

### If Lottery Fails:
1. Check bot wallet has sufficient SOL
2. Verify token holder data
3. Manually execute payout if needed
4. Record in database manually

### If Database Corrupted:
1. Stop bot immediately
2. Restore from latest backup
3. Verify data integrity
4. Restart bot

## Support Commands

```bash
# Check database
sqlite3 pegasus.db "SELECT * FROM buyback_transactions ORDER BY created_at DESC LIMIT 10;"
sqlite3 pegasus.db "SELECT * FROM lottery_pool;"
sqlite3 pegasus.db "SELECT * FROM buyback_volume;"

# Check Solana balance
solana balance <wallet_address> --url devnet

# View transaction
solana confirm <signature> --url devnet
```

## Success Criteria

✅ All 24 tests pass
✅ No funds lost during testing
✅ All transactions confirm on-chain
✅ Database updates correctly
✅ Error messages clear and helpful
✅ Security measures effective
✅ Performance acceptable
✅ Ready for mainnet deployment

---

**🐴 Ready to ascend? Test thoroughly, then soar! ✨**
