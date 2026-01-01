import { Telegraf, Markup } from 'telegraf'
import db from '../database/db'
import { getBalance, getWalletAddress } from '../services/solana'
import { 
  linkWalletCommand, 
  handleWalletLinkMessage, 
  myWalletCommand, 
  unlinkWalletCommand 
} from './commands/linkWallet'
import { buybackCommand, confirmBuyback, cancelBuyback } from './commands/buyback'
import { startCommand } from './commands/start'
import { helpCommand } from './commands/help'
import { balanceCommand } from './commands/balance'
import { statsCommand } from './commands/stats'
import { lotteryCommand } from './commands/lottery'
import { lotteryHistoryCommand } from './commands/lotteryHistory'
import { nextMilestoneCommand } from './commands/nextMilestone'
import { autoBuybackCommand } from './commands/autoBuyback'
import { cancelTriggerCommand, handleCancelTrigger } from './commands/cancelTrigger'
import { freezeStatusCommand } from './commands/freezeStatus'
import { executeFreezeCommand, handleFreezeConfirmation } from './commands/executeFreeze'
import { cancelCommand } from './commands/cancel'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

// Global error handler
bot.catch((err: any, ctx) => {
  console.error('❌ BOT ERROR:', err)
  console.error('Error details:', err.message)
  console.error('Update:', JSON.stringify(ctx.update, null, 2))
  
  try {
    ctx.reply('⚠️ An error occurred. Please try again or use /cancel to reset.').catch(console.error)
  } catch (e) {
    console.error('Failed to send error message:', e)
  }
})

// Log all incoming messages
bot.use((ctx, next) => {
  const text = (ctx.message as any)?.text || (ctx.callbackQuery as any)?.data
  if (text) {
    console.log('📨 Incoming:', text, 'from user:', ctx.from?.id)
  }
  return next()
})

// Rate limiting
const userCooldown = new Map<number, number>()
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id
  if (!userId) return next()
  
  const now = Date.now()
  const last = userCooldown.get(userId) || 0
  if (now - last < 1000) return
  
  userCooldown.set(userId, now)
  
  return next()
})

// Text message handler for conversation flows (AFTER commands are registered)
bot.on('text', async (ctx, next) => {
  // Only process text if it's not a command
  const messageText = ctx.message.text
  if (messageText.startsWith('/')) {
    return next() // Let command handlers deal with it
  }
  
  // Check if user is in wallet linking flow
  const walletHandled = await handleWalletLinkMessage(ctx)
  if (walletHandled) return
  
  // Check if user is in freeze confirmation flow
  const freezeHandled = await handleFreezeConfirmation(ctx)
  if (freezeHandled) return
  
  // If no handler processed it, continue
  return next()
})

// Command handlers (registered BEFORE text handlers)
bot.command('start', startCommand)
bot.command('help', helpCommand)
bot.command('cancel', cancelCommand)

bot.command('balance', balanceCommand)

bot.command('lottery', lotteryCommand)

bot.command('stats', statsCommand)
bot.command('lottery_history', lotteryHistoryCommand)
bot.command('next_milestone', nextMilestoneCommand)
bot.command('auto_buyback', autoBuybackCommand)
bot.command('cancel_trigger', cancelTriggerCommand)

// Freeze protocol commands
bot.command('freeze_status', freezeStatusCommand)
bot.command('execute_freeze', executeFreezeCommand)

// Wallet commands
bot.command('link_wallet', linkWalletCommand)
bot.command('my_wallet', myWalletCommand)
bot.command('unlink_wallet', unlinkWalletCommand)

// Buyback commands
bot.command('buyback', buybackCommand)

// Handle button callbacks
bot.action('help', async (ctx) => {
  try {
    await ctx.answerCbQuery()
  } catch (e) {
    // Ignore old callback query errors
  }
  try {
    await ctx.editMessageText(
    `🐴 *PEGASUS PROTOCOL Commands*

🔑 *WALLET COMMANDS:*
/link\_wallet - Link your Solana wallet
/my\_wallet - View wallet info & balance
/unlink\_wallet - Remove linked wallet

💰 *BUYBACK COMMANDS:*
/balance - Check your SOL balance
/buyback <amount> - Execute manual buyback
  _Example: /buyback 1.5_
/auto\_buyback <price> <amount> - Set price trigger
  _Example: /auto\_buyback 0.05 2_
/cancel\_trigger - Cancel active triggers

🎰 *LOTTERY COMMANDS:*
/lottery - Current pool & next milestone
/lottery\_history - View past winners
/next\_milestone - Progress to next lottery

📊 *STATS & INFO:*
/stats - View buyback statistics
/help - Show this message

Need help? Ascension awaits. 🐴✨`,
    { parse_mode: 'Markdown' }
  )
  } catch (e) {
    console.error('Help callback error:', e)
  }
})

bot.action('lottery', async (ctx) => {
  try {
    await ctx.answerCbQuery()
  } catch (e) {
    // Ignore old callback query errors
  }
  try {
  const pool = db.prepare('SELECT * FROM lottery_pool WHERE id = 1').get() as any
  const volume = db.prepare('SELECT total_volume FROM buyback_volume WHERE id = 1').get() as any
  
  const progress = Math.min((volume.total_volume / pool.next_milestone) * 100, 100)
  const progressBar = '▓'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10))
  
  await ctx.editMessageText(
    `🎰 *PEGASUS LOTTERY*

Current Pool: *${pool.current_amount.toFixed(2)} SOL* 💰
Next Milestone: ${pool.next_milestone.toLocaleString()} SOL
Progress: [${progressBar}] ${progress.toFixed(1)}%

Volume climbing... Pool growing! 🐴✨`,
    { parse_mode: 'Markdown' }
  )
  } catch (e) {
    console.error('Lottery callback error:', e)
  }
})

bot.action('buyback', async (ctx) => {
  try {
    await ctx.answerCbQuery()
  } catch (e) {
    // Ignore old callback query errors
  }
  try {
  await ctx.editMessageText(
    `💰 *Execute Buyback*

Use /buyback <amount> to execute a buyback.

Example: /buyback 1.5`,
    { parse_mode: 'Markdown' }
  )
  } catch (e) {
    console.error('Buyback callback error:', e)
  }
})

bot.action('auto_buyback', async (ctx) => {
  try {
    await ctx.answerCbQuery()
  } catch (e) {
    // Ignore old callback query errors
  }
  try {
  await ctx.editMessageText(
    `🎯 *Set Price Trigger*

Use /auto\_buyback <price> <amount> to set a trigger.

Example: /auto\_buyback 0.05 2

The bot will execute when price reaches your target! 🐴`,
    { parse_mode: 'Markdown' }
  )
  } catch (e) {
    console.error('Auto buyback callback error:', e)
  }
})

// Buyback confirmation callbacks
bot.action(/^confirm_buyback_(\d+)$/, async (ctx) => {
  await confirmBuyback(ctx, bot)
})

bot.action(/^cancel_buyback_(\d+)$/, async (ctx) => {
  await cancelBuyback(ctx)
})

// Cancel trigger callback
bot.action(/^cancel_trigger_(\d+)$/, async (ctx) => {
  await handleCancelTrigger(ctx)
})

export default bot
