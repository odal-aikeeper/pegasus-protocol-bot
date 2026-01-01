# 🔒 Pegasus Protocol - Freeze Protocol Testing Guide

## ⚠️ CRITICAL WARNING

**THE FREEZE PROTOCOL IS IRREVERSIBLE!**

- Once executed, the wallet CANNOT be unfrozen
- The wallet will NEVER be able to transfer tokens again
- There is NO way to undo this action
- **ALWAYS TEST ON DEVNET FIRST**

## Prerequisites

### 1. Environment Configuration

Add to your `.env` file:

```env
# Freeze Protocol Configuration
DEV_WALLET_ADDRESS=<developer_wallet_public_key>
DEV_TOKEN_ACCOUNT=<developer_token_account_address>
DEV_WALLET_PRIVATE_KEY=<developer_wallet_private_key_base58>

# Admin Configuration
ADMIN_TELEGRAM_IDS=123456789,987654321

# Solana Configuration (DEVNET for testing!)
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 2. Get Token Account Address

```bash
# Install SPL Token CLI
npm install -g @solana/spl-token-cli

# Find your token account
spl-token accounts <TOKEN_MINT_ADDRESS> --owner <DEV_WALLET_ADDRESS> --url devnet

# Output will show:
# Token Account: <THIS_IS_YOUR_DEV_TOKEN_ACCOUNT>
```

### 3. Verify Wallet Has Tokens

```bash
spl-token balance <TOKEN_MINT_ADDRESS> --owner <DEV_WALLET_ADDRESS> --url devnet
```

## Testing Checklist

### Phase 1: Setup Verification ✅

**Test 1: Environment Variables**
```bash
# Verify all required variables are set
echo $DEV_WALLET_ADDRESS
echo $DEV_TOKEN_ACCOUNT
echo $DEV_WALLET_PRIVATE_KEY
echo $ADMIN_TELEGRAM_IDS
```

**Expected Results:**
- ✅ All variables populated
- ✅ Addresses are valid Solana addresses
- ✅ Private key is base58 encoded

**Test 2: Database Schema**
```bash
# Check freeze_protocol table exists
sqlite3 pegasus.db "SELECT name FROM sqlite_master WHERE type='table' AND name='freeze_protocol';"
```

**Expected Results:**
- ✅ Table exists
- ✅ Columns: id, wallet_address, frozen, freeze_date, freeze_type, unlock_date, tx_signature, created_at

### Phase 2: Public Commands ✅

**Test 3: /freeze_status (Before Freeze)**
```
User: /freeze_status
```

**Expected Results:**
- ✅ Shows developer wallet (shortened)
- ✅ Status: "NOT FROZEN"
- ✅ Message about freeze coming soon
- ✅ No errors

**Test 4: /freeze_status in /help**
```
User: /help
```

**Expected Results:**
- ✅ Command listed under "TRANSPARENCY" section
- ✅ Description: "Check dev wallet freeze status"

**Test 5: Freeze Status in /stats**
```
User: /stats
```

**Expected Results:**
- ✅ Shows "🔒 Freeze Status: ⚠️ Not Frozen"
- ✅ All other stats display correctly

**Test 6: Freeze Badge in /start**
```
User: /start
```

**Expected Results:**
- ✅ Welcome message displays
- ✅ No freeze badge shown (before freeze)
- ✅ All buttons work

### Phase 3: Admin Authorization ✅

**Test 7: Non-Admin Access**
```
User (non-admin): /execute_freeze
```

**Expected Results:**
- ✅ Error: "⛔ Unauthorized command."
- ✅ No further prompts
- ✅ Command hidden from regular users

**Test 8: Admin Access**
```
Admin: /execute_freeze
```

**Expected Results:**
- ✅ Warning message displayed
- ✅ Shows wallet addresses
- ✅ Asks for "CONFIRM FREEZE" confirmation
- ✅ Warns about irreversibility

**Test 9: Freeze Cancellation**
```
Admin: /execute_freeze
Admin: cancel
```

**Expected Results:**
- ✅ Message: "❌ Freeze cancelled."
- ✅ No freeze executed
- ✅ Can try again

### Phase 4: Freeze Execution (DEVNET ONLY!) ✅

**Test 10: Pre-Freeze Verification**
```bash
# Check token account authority BEFORE freeze
spl-token account-info <DEV_TOKEN_ACCOUNT> --url devnet
```

**Expected Results:**
- ✅ Owner: <DEV_WALLET_ADDRESS>
- ✅ Authority exists
- ✅ Can transfer tokens

**Test 11: Execute Freeze**
```
Admin: /execute_freeze
Admin: CONFIRM FREEZE
```

**Expected Results:**
- ✅ Processing message shown
- ✅ Freeze executes successfully
- ✅ Transaction signature provided
- ✅ Success message with Solscan link
- ✅ Database updated

**Test 12: Post-Freeze Verification**
```bash
# Check token account authority AFTER freeze
spl-token account-info <DEV_TOKEN_ACCOUNT> --url devnet
```

**Expected Results:**
- ✅ Owner: 11111111111111111111111111111111 (null)
- ✅ Authority removed
- ✅ Account frozen

**Test 13: Verify Cannot Transfer**
```bash
# Try to transfer tokens (should fail)
spl-token transfer <TOKEN_MINT_ADDRESS> 1 <RECIPIENT_ADDRESS> --owner <DEV_WALLET_ADDRESS> --url devnet
```

**Expected Results:**
- ✅ Error: "Account is frozen" or similar
- ✅ Transfer fails
- ✅ Tokens remain in account

### Phase 5: Post-Freeze Status ✅

**Test 14: /freeze_status (After Freeze)**
```
User: /freeze_status
```

**Expected Results:**
- ✅ Status: "🔒 FROZEN"
- ✅ Freeze Type: "Permanent Lock"
- ✅ Shows freeze date
- ✅ Shows days frozen
- ✅ Lists what wallet CANNOT do
- ✅ Lists what freeze ensures
- ✅ Solscan link to transaction
- ✅ Message: "The freeze is irreversible"

**Test 15: /stats (After Freeze)**
```
User: /stats
```

**Expected Results:**
- ✅ Shows "🔒 Freeze Status: ✅ LOCKED"
- ✅ All other stats correct

**Test 16: /start (After Freeze)**
```
User: /start
```

**Expected Results:**
- ✅ Shows "🐴 Welcome to Pegasus Protocol 🔒"
- ✅ Freeze badge (🔒) visible
- ✅ All functionality works

**Test 17: Database Record**
```bash
sqlite3 pegasus.db "SELECT * FROM freeze_protocol WHERE frozen = 1;"
```

**Expected Results:**
- ✅ Record exists
- ✅ wallet_address correct
- ✅ frozen = 1
- ✅ freeze_date populated
- ✅ freeze_type = 'permanent'
- ✅ tx_signature present

### Phase 6: On-Chain Verification ✅

**Test 18: Solscan Verification**
```
1. Get transaction signature from freeze execution
2. Visit: https://solscan.io/tx/<SIGNATURE>?cluster=devnet
3. Verify transaction details
```

**Expected Results:**
- ✅ Transaction confirmed
- ✅ Shows setAuthority instruction
- ✅ New authority: null (System Program)
- ✅ Transaction successful

**Test 19: Multiple Freeze Attempts**
```
Admin: /execute_freeze
```

**Expected Results:**
- ✅ Error: "Freeze Protocol already executed!"
- ✅ Shows original freeze date
- ✅ Directs to /freeze_status
- ✅ No duplicate freeze possible

### Phase 7: Error Handling ✅

**Test 20: Missing Configuration**
```
1. Remove DEV_TOKEN_ACCOUNT from .env
2. Admin: /execute_freeze
```

**Expected Results:**
- ✅ Error: "Configuration Error"
- ✅ Lists missing variables
- ✅ No freeze attempted

**Test 21: Invalid Token Account**
```
1. Set DEV_TOKEN_ACCOUNT to invalid address
2. Admin: /execute_freeze
3. Admin: CONFIRM FREEZE
```

**Expected Results:**
- ✅ Error message displayed
- ✅ Freeze fails gracefully
- ✅ Database not updated
- ✅ Clear error explanation

**Test 22: Network Errors**
```
1. Disconnect internet
2. Admin: /execute_freeze
3. Admin: CONFIRM FREEZE
```

**Expected Results:**
- ✅ Error: Network/RPC error
- ✅ Freeze not executed
- ✅ Can retry when online

## Security Testing

### Test 23: Admin ID Validation
```
1. Try with non-admin telegram ID
2. Try with admin ID in wrong format
3. Try with multiple admin IDs
```

**Expected Results:**
- ✅ Only valid admin IDs can execute
- ✅ ID matching is exact
- ✅ Multiple admins supported

### Test 24: Confirmation Validation
```
Admin: /execute_freeze
Admin: confirm freeze (lowercase)
```

**Expected Results:**
- ✅ Error: Must be exact "CONFIRM FREEZE"
- ✅ Case sensitive
- ✅ No partial matches

### Test 25: Session Management
```
Admin: /execute_freeze
(Wait 5 minutes)
Admin: CONFIRM FREEZE
```

**Expected Results:**
- ✅ Confirmation still works
- ✅ Session persists
- ✅ Or timeout with clear message

## Mainnet Deployment Checklist

Before executing freeze on mainnet:

- [ ] All devnet tests pass
- [ ] Freeze verified on-chain (devnet)
- [ ] Cannot transfer tokens after freeze (devnet)
- [ ] Database updates correctly
- [ ] Admin controls work
- [ ] Public commands work
- [ ] Error handling tested
- [ ] Community announcement prepared
- [ ] Solscan link ready
- [ ] **Triple-check wallet addresses**
- [ ] **Verify this is the correct wallet to freeze**
- [ ] **Understand this is PERMANENT and IRREVERSIBLE**

## Mainnet Execution Steps

1. **Final Verification**
   ```bash
   # Verify wallet address
   echo $DEV_WALLET_ADDRESS
   
   # Verify token account
   echo $DEV_TOKEN_ACCOUNT
   
   # Check current authority
   spl-token account-info $DEV_TOKEN_ACCOUNT
   ```

2. **Execute Freeze**
   ```
   Admin: /execute_freeze
   (Read warning carefully)
   Admin: CONFIRM FREEZE
   ```

3. **Verify Success**
   ```bash
   # Check on-chain
   spl-token account-info $DEV_TOKEN_ACCOUNT
   
   # Verify in bot
   /freeze_status
   ```

4. **Announce to Community**
   - Post Solscan link
   - Explain what freeze means
   - Highlight transparency
   - Celebrate commitment

## Emergency Procedures

### If Freeze Fails:
1. Check error message
2. Verify wallet has authority
3. Check RPC connection
4. Verify token account exists
5. Contact Solana support if needed

### If Wrong Wallet Frozen:
**THERE IS NO RECOVERY**
- The freeze is permanent
- Tokens are locked forever
- This is why testing on devnet is critical

### If Database Not Updated:
```bash
# Manually insert record
sqlite3 pegasus.db
INSERT INTO freeze_protocol (wallet_address, frozen, freeze_date, freeze_type, tx_signature)
VALUES ('<WALLET>', 1, strftime('%s', 'now'), 'permanent', '<TX_SIGNATURE>');
```

## Support Commands

```bash
# Check freeze status on-chain
spl-token account-info <TOKEN_ACCOUNT> --url devnet

# View transaction
solana confirm <SIGNATURE> --url devnet

# Check database
sqlite3 pegasus.db "SELECT * FROM freeze_protocol;"

# Verify authority
spl-token account-info <TOKEN_ACCOUNT> --url devnet | grep Owner
```

## Success Criteria

✅ All 25 tests pass on devnet
✅ Freeze executes successfully
✅ Wallet cannot transfer tokens
✅ On-chain verification confirms freeze
✅ Database records accurate
✅ Public commands show correct status
✅ Admin controls secure
✅ Error handling comprehensive
✅ Community can verify on Solscan

---

## 🔒 FINAL WARNING

**THE FREEZE PROTOCOL IS PERMANENT AND IRREVERSIBLE**

- Test thoroughly on devnet
- Verify wallet addresses multiple times
- Understand there is no undo
- This is a one-way operation
- Once frozen, tokens are locked forever

**Only execute on mainnet when:**
- All tests pass on devnet
- Community is informed
- You are 100% certain
- You understand the consequences

🐴 The pegasus commits with the community. Freeze responsibly. 💎
