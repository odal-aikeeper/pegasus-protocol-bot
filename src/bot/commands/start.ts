import { Context, Markup } from 'telegraf'
import db from '../../database/db'

export async function startCommand(ctx: Context) {
  const telegramId = ctx.from!.id
  const username = ctx.from!.username || 'Unknown'
  
  db.prepare('INSERT OR IGNORE INTO users (telegram_id, username) VALUES (?, ?)').run(telegramId, username)
  
  // Check freeze status for welcome message
  const freezeRecord = db.prepare('SELECT frozen FROM freeze_protocol WHERE frozen = 1 LIMIT 1').get() as any
  const freezeBadge = freezeRecord ? ' 🔒' : ''
  
  await ctx.reply(
    `🐴 *Welcome to Pegasus Protocol*${freezeBadge}

Your automated Solana buyback infrastructure with lottery rewards.

✨ Set up automated buybacks with price triggers
💎 Freeze mechanics for liquidity stability  
🎰 Win lottery rewards at volume milestones
📊 Track all your buyback activity

Type /help to see all available commands.

Ready to ascend? Let's go! ⬆️`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('📊 View Commands', 'help'),
          Markup.button.callback('🎰 Check Lottery', 'lottery')
        ],
        [Markup.button.callback('💰 Buy Now', 'buyback')]
      ])
    }
  )
}
