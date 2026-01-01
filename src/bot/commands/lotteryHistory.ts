import { Context } from 'telegraf'
import db from '../../database/db'

export async function lotteryHistoryCommand(ctx: Context) {
  const winners = db.prepare(
    'SELECT * FROM lottery_winners ORDER BY won_at DESC LIMIT 10'
  ).all() as any[]
  
  if (winners.length === 0) {
    await ctx.reply(
      `🎰 *Lottery History*

No winners yet!

Be the first to ascend when we hit the next milestone. 🐴✨`,
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  const totalPaid = db.prepare('SELECT SUM(amount) as total FROM lottery_winners').get() as any
  
  let message = `🎰 *Lottery History*\n\nRecent Winners:\n\n`
  
  winners.forEach((winner, index) => {
    const shortWallet = `${winner.winner_wallet.slice(0, 4)}...${winner.winner_wallet.slice(-4)}`
    const date = new Date(winner.won_at * 1000).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
    
    message += `${index + 1}. *${winner.milestone.toLocaleString()} Milestone* - ${date}\n`
    message += `   Winner: \`${shortWallet}\`\n`
    message += `   Won: ${winner.amount.toFixed(2)} SOL 💰\n\n`
  })
  
  message += `Total paid out: ${totalPaid.total.toFixed(2)} SOL\n`
  message += `Total winners: ${winners.length}\n\n`
  message += `Will you ascend next? 🐴`
  
  await ctx.reply(message, { parse_mode: 'Markdown' })
}
