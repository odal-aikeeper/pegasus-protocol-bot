import { Context } from 'telegraf'
import db from '../../database/db'
import { checkFreezeStatus } from '../../services/freeze'

export async function freezeStatusCommand(ctx: Context) {
  try {
    // Check database for freeze record
    const freezeRecord = db.prepare(
      'SELECT * FROM freeze_protocol WHERE frozen = 1 ORDER BY freeze_date DESC LIMIT 1'
    ).get() as any
    
    const devWallet = process.env.DEV_WALLET_ADDRESS
    const devTokenAccount = process.env.DEV_TOKEN_ACCOUNT
    
    if (!devWallet) {
      await ctx.reply(
        `💎 *FREEZE PROTOCOL STATUS*\n\n` +
        `Status: ⚠️ Not configured\n\n` +
        `Developer wallet not set.`,
        { parse_mode: 'Markdown' }
      )
      return
    }
    
    const shortWallet = `${devWallet.slice(0, 4)}...${devWallet.slice(-4)}`
    
    // If we have a freeze record, show frozen status
    if (freezeRecord) {
      const freezeDate = new Date(freezeRecord.freeze_date * 1000)
      const daysFrozen = Math.floor((Date.now() - freezeDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const txLink = process.env.SOLANA_RPC_URL?.includes('devnet')
        ? `https://solscan.io/tx/${freezeRecord.tx_signature}?cluster=devnet`
        : `https://solscan.io/tx/${freezeRecord.tx_signature}`
      
      let message = `💎 *FREEZE PROTOCOL STATUS*\n\n`
      message += `Developer Wallet: \`${shortWallet}\`\n\n`
      message += `Status: 🔒 *FROZEN*\n`
      message += `Freeze Type: ${freezeRecord.freeze_type === 'permanent' ? 'Permanent Lock' : 'Timed Lock'}\n`
      message += `Locked Since: ${freezeDate.toLocaleDateString()}\n`
      message += `Duration: ${daysFrozen} days\n\n`
      message += `The dev wallet CANNOT:\n`
      message += `❌ Sell tokens\n`
      message += `❌ Transfer tokens\n`
      message += `❌ Remove liquidity\n\n`
      message += `This ensures:\n`
      message += `✅ Long-term commitment\n`
      message += `✅ No rug pulls\n`
      message += `✅ Community trust\n\n`
      
      if (freezeRecord.freeze_type === 'permanent') {
        message += `The freeze is irreversible. Pegasus ascends with holders. 🐴✨\n\n`
      }
      
      message += `Verify: [View on Solscan](${txLink})`
      
      await ctx.reply(message, { parse_mode: 'Markdown' })
    } else {
      // Not frozen yet
      let message = `💎 *FREEZE PROTOCOL STATUS*\n\n`
      message += `Developer Wallet: \`${shortWallet}\`\n\n`
      message += `Status: ⚠️ *NOT FROZEN*\n\n`
      
      // If we have token account, check on-chain status
      if (devTokenAccount) {
        await ctx.reply(`⏳ Checking on-chain status...`)
        const onChainStatus = await checkFreezeStatus(devTokenAccount)
        
        if (onChainStatus.frozen) {
          message += `🔒 On-chain verification: FROZEN\n\n`
          message += `The wallet appears to be frozen on-chain but not recorded in database.\n`
          message += `Contact admin to update records.`
        } else {
          message += `Freeze coming soon. Stay tuned for announcement.\n\n`
          message += `The protocol will demonstrate commitment through permanent wallet locking. 🐴✨`
        }
      } else {
        message += `Freeze coming soon. Stay tuned for announcement.`
      }
      
      await ctx.reply(message, { parse_mode: 'Markdown' })
    }
  } catch (error) {
    console.error('Freeze status error:', error)
    await ctx.reply(
      `❌ Error checking freeze status.\n\n` +
      `Please try again later.`
    )
  }
}
