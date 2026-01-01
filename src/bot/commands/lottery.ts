import { Context } from 'telegraf'
import db from '../../database/db'
import { formatMarketCap, createProgressBar } from '../../services/marketCapTracker'

export async function lotteryCommand(ctx: Context) {
  try {
    const pool = db.prepare('SELECT * FROM lottery_pool WHERE id = 1').get() as any
    
    if (!pool) {
      await ctx.reply('⚠️ Lottery not initialized yet.')
      return
    }
    
    const poolAmount = (pool.current_amount || 0).toFixed(2)
    const currentMC = pool.current_market_cap || 0
    const nextMilestone = pool.next_milestone_market_cap || 30000
    
    const percentage = Math.min((currentMC / nextMilestone) * 100, 100)
    const progressBar = createProgressBar(percentage)
    
    await ctx.reply(
      `🎰 *PEGASUS LOTTERY*\n\n` +
      `Current Pool: *${poolAmount} SOL* 💰\n\n` +
      `Next Milestone: *$${formatMarketCap(nextMilestone)} Market Cap*\n` +
      `Current Market Cap: *$${formatMarketCap(currentMC)}*\n` +
      `Progress: ${progressBar} ${percentage.toFixed(1)}%\n\n` +
      `When we hit $${formatMarketCap(nextMilestone)} market cap, a random holder wins the entire pool!\n\n` +
      `Market cap climbing... Pool growing! 🐴✨`,
      { parse_mode: 'Markdown' }
    )
  } catch (error) {
    console.error('❌ Lottery error:', error)
    await ctx.reply('❌ Failed to load lottery data.')
  }
}
