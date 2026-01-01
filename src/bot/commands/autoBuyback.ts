import { Context } from 'telegraf'
import db from '../../database/db'

export async function autoBuybackCommand(ctx: Context) {
  const telegramId = ctx.from!.id
  const args = (ctx.message as any)?.text?.split(' ').slice(1)
  
  if (!args || args.length < 2) {
    await ctx.reply(
      `🎯 *Set Price Trigger*\n\n` +
      `Usage: /auto_buyback <trigger_price> <amount>\n\n` +
      `Example: \`/auto_buyback 0.05 2\`\n\n` +
      `This will automatically buy when price reaches or drops below the trigger price.`,
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  const triggerPrice = parseFloat(args[0])
  const amount = parseFloat(args[1])
  
  if (isNaN(triggerPrice) || triggerPrice <= 0) {
    await ctx.reply(`❌ Invalid trigger price. Please enter a positive number.`)
    return
  }
  
  if (isNaN(amount) || amount <= 0) {
    await ctx.reply(`❌ Invalid amount. Please enter a positive number.`)
    return
  }
  
  const user = db.prepare(
    'SELECT wallet_address FROM users WHERE telegram_id = ?'
  ).get(telegramId) as any
  
  if (!user?.wallet_address) {
    await ctx.reply(
      `❌ *No Wallet Linked*\n\n` +
      `Please link your Solana wallet first using /link\\_wallet`,
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  try {
    db.prepare(
      'INSERT INTO price_triggers (telegram_id, trigger_price, amount_sol, is_active) VALUES (?, ?, ?, 1)'
    ).run(telegramId, triggerPrice, amount)
    
    const currentPrice = 0.075
    
    await ctx.reply(
      `🎯 *Price Trigger Set!*

Trigger price: ${triggerPrice} SOL
Buyback amount: ${amount} SOL
Current price: ${currentPrice} SOL

Status: 🟢 Active

The bot will execute when price reaches or drops below ${triggerPrice}.

Cancel anytime with /cancel_trigger`,
      { parse_mode: 'Markdown' }
    )
  } catch (error) {
    console.error('Auto buyback error:', error)
    await ctx.reply(
      `❌ Failed to set price trigger.\n\n` +
      `Please try again later.`
    )
  }
}
