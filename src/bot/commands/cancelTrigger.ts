import { Context, Markup } from 'telegraf'
import db from '../../database/db'

export async function cancelTriggerCommand(ctx: Context) {
  const telegramId = ctx.from!.id
  
  const triggers = db.prepare(
    'SELECT * FROM price_triggers WHERE telegram_id = ? AND is_active = 1'
  ).all(telegramId) as any[]
  
  if (triggers.length === 0) {
    await ctx.reply(
      `No active triggers found.

Set one with /auto_buyback`,
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  let message = `🎯 *Active Price Triggers*\n\n`
  
  const buttons: any[] = []
  
  triggers.forEach((trigger, index) => {
    message += `${index + 1}. Buy ${trigger.amount_sol} SOL at ${trigger.trigger_price}\n`
    buttons.push([
      Markup.button.callback(
        `❌ Cancel Trigger ${index + 1}`, 
        `cancel_trigger_${trigger.id}`
      )
    ])
  })
  
  message += `\nTotal active: ${triggers.length}`
  
  await ctx.reply(
    message,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    }
  )
}

export async function handleCancelTrigger(ctx: any) {
  try {
    await ctx.answerCbQuery()
  } catch (e) {
  }
  
  const triggerId = ctx.match[1]
  
  db.prepare(
    'UPDATE price_triggers SET is_active = 0 WHERE id = ?'
  ).run(triggerId)
  
  await ctx.editMessageText(
    `✅ Price trigger cancelled successfully.`,
    { parse_mode: 'Markdown' }
  )
}
