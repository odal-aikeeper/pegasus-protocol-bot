import { Context } from 'telegraf'
import { PublicKey } from '@solana/web3.js'
import db from '../../database/db'
import { freezeDevWallet, verifyFreeze } from '../../services/freeze'

// Session state management (simple in-memory store)
const freezeConfirmationSessions = new Map<number, boolean>()

export async function executeFreezeCommand(ctx: Context) {
  const telegramId = ctx.from!.id
  
  // Check if user is admin
  const adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id.trim())) || []
  
  if (!adminIds.includes(telegramId)) {
    await ctx.reply('⛔ Unauthorized command.')
    return
  }
  
  // Check if already frozen
  const existingFreeze = db.prepare(
    'SELECT * FROM freeze_protocol WHERE frozen = 1 LIMIT 1'
  ).get() as any
  
  if (existingFreeze) {
    await ctx.reply(
      `⚠️ Freeze Protocol already executed!\n\n` +
      `Wallet was frozen on ${new Date(existingFreeze.freeze_date * 1000).toLocaleDateString()}\n\n` +
      `Use /freeze_status to view details.`
    )
    return
  }
  
  // Check required environment variables
  if (!process.env.DEV_WALLET_ADDRESS || !process.env.DEV_TOKEN_ACCOUNT || !process.env.DEV_WALLET_PRIVATE_KEY) {
    await ctx.reply(
      `❌ Configuration Error\n\n` +
      `Missing required environment variables:\n` +
      `- DEV_WALLET_ADDRESS\n` +
      `- DEV_TOKEN_ACCOUNT\n` +
      `- DEV_WALLET_PRIVATE_KEY\n\n` +
      `Please configure before executing freeze.`
    )
    return
  }
  
  // Set session state
  freezeConfirmationSessions.set(telegramId, true)
  
  await ctx.reply(
    `⚠️ *WARNING: Execute Freeze Protocol?*\n\n` +
    `This will *PERMANENTLY* lock the dev wallet.\n\n` +
    `❌ This action is *IRREVERSIBLE*\n` +
    `❌ The wallet will *NEVER* be able to transfer tokens again\n` +
    `❌ There is *NO WAY* to undo this\n\n` +
    `Developer Wallet: \`${process.env.DEV_WALLET_ADDRESS}\`\n` +
    `Token Account: \`${process.env.DEV_TOKEN_ACCOUNT}\`\n\n` +
    `Type *"CONFIRM FREEZE"* (exactly) to proceed.\n` +
    `Type anything else to cancel.`,
    { parse_mode: 'Markdown' }
  )
}

export async function handleFreezeConfirmation(ctx: Context) {
  const telegramId = ctx.from!.id
  const messageText = (ctx.message as any)?.text
  
  // Check if user is in freeze confirmation flow
  if (!freezeConfirmationSessions.has(telegramId)) {
    return false // Not in freeze flow
  }
  
  // Ignore commands - let them be handled by command handlers
  if (messageText && messageText.startsWith('/')) {
    freezeConfirmationSessions.delete(telegramId)
    return false
  }
  
  // Remove from session
  freezeConfirmationSessions.delete(telegramId)
  
  if (messageText !== 'CONFIRM FREEZE') {
    await ctx.reply('❌ Freeze cancelled.')
    return true
  }
  
  await ctx.reply(
    `🔒 *Executing Freeze Protocol...*\n\n` +
    `This will take a moment. The pegasus is locking down... 🐴💎`,
    { parse_mode: 'Markdown' }
  )
  
  try {
    // Execute freeze
    const devTokenAccount = process.env.DEV_TOKEN_ACCOUNT!
    const devWalletPrivateKey = process.env.DEV_WALLET_PRIVATE_KEY!
    const devWalletAddress = process.env.DEV_WALLET_ADDRESS!
    
    console.log('🔒 Starting Freeze Protocol execution...')
    const signature = await freezeDevWallet(devWalletPrivateKey, devTokenAccount)
    
    // Verify freeze was successful
    console.log('🔍 Verifying freeze on-chain...')
    const isVerified = await verifyFreeze(devTokenAccount)
    
    if (!isVerified) {
      throw new Error('Freeze verification failed - wallet may not be properly frozen')
    }
    
    // Update database
    const freezeDate = Math.floor(Date.now() / 1000)
    db.prepare(
      `INSERT INTO freeze_protocol (wallet_address, frozen, freeze_date, freeze_type, tx_signature) 
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      devWalletAddress,
      1,
      freezeDate,
      'permanent',
      signature
    )
    
    const txLink = process.env.SOLANA_RPC_URL?.includes('devnet')
      ? `https://solscan.io/tx/${signature}?cluster=devnet`
      : `https://solscan.io/tx/${signature}`
    
    await ctx.reply(
      `✅ *FREEZE PROTOCOL EXECUTED*\n\n` +
      `Developer wallet is now *PERMANENTLY LOCKED*. 🔒\n\n` +
      `Wallet: \`${devWalletAddress.slice(0, 4)}...${devWalletAddress.slice(-4)}\`\n` +
      `TX: [View on Solscan](${txLink})\n\n` +
      `This action is irreversible. The protocol is committed. 🐴💎\n\n` +
      `Use /freeze_status to view public status.`,
      { parse_mode: 'Markdown' }
    )
    
    // Optional: Broadcast to all users
    await broadcastFreezeAnnouncement(signature)
    
  } catch (error: any) {
    console.error('❌ Freeze execution failed:', error)
    await ctx.reply(
      `❌ *Freeze Failed*\n\n` +
      `Error: ${error.message}\n\n` +
      `The wallet was NOT frozen. Please check logs and try again.`,
      { parse_mode: 'Markdown' }
    )
  }
  
  return true
}

async function broadcastFreezeAnnouncement(signature: string) {
  try {
    const users = db.prepare('SELECT telegram_id FROM users').all() as any[]
    
    const txLink = process.env.SOLANA_RPC_URL?.includes('devnet')
      ? `https://solscan.io/tx/${signature}?cluster=devnet`
      : `https://solscan.io/tx/${signature}`
    
    const message = `
🔒 *FREEZE PROTOCOL ANNOUNCEMENT* 🔒

The Pegasus Protocol developer wallet has been *PERMANENTLY FROZEN*.

This means:
✅ No selling
✅ No transfers
✅ No rug pulls
✅ Long-term commitment

The protocol is locked in with the community.

Verify: [View on Solscan](${txLink})

Use /freeze_status to check anytime.

The pegasus ascends with holders! 🐴💎✨
    `.trim()
    
    console.log(`📢 Broadcasting freeze announcement to ${users.length} users...`)
    
    for (const user of users) {
      try {
        // Note: This requires bot instance - you may need to pass it as parameter
        // For now, we'll skip the broadcast or implement it in the bot index
        console.log(`Would send to user ${user.telegram_id}`)
      } catch (error) {
        console.error(`Failed to send to ${user.telegram_id}:`, error)
      }
    }
  } catch (error) {
    console.error('Broadcast error:', error)
  }
}
