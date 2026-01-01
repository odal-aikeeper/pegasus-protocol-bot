import { Context } from 'telegraf'
import db from '../../database/db'
import { formatMarketCap, createProgressBar } from '../../services/marketCapTracker'

export async function nextMilestoneCommand(ctx: Context) {
  try {
    const pool = db.prepare('SELECT * FROM lottery_pool WHERE id = 1').get() as any
    
    if (!pool) {
      await ctx.reply('⚠️ Lottery not initialized yet.')
      return
    }
    
    const currentMC = pool.current_market_cap || 0
    const nextMilestone = pool.next_milestone_market_cap || 30000
    const remaining = Math.max(nextMilestone - currentMC, 0)
    const percentage = Math.min((currentMC / nextMilestone) * 100, 100)
    const progressBar = createProgressBar(percentage)
    
    await ctx.reply(
      `🎯 *Next Lottery Milestone*\n\n` +
      `Target: *$${formatMarketCap(nextMilestone)} Market Cap*\n` +
      `Current: *$${formatMarketCap(currentMC)}*\n` +
      `Remaining: *$${formatMarketCap(remaining)}*\n\n` +
      `Progress: ${progressBar} ${percentage.toFixed(1)}%\n\n` +
      `Keep ascending! 🐴✨`,
      { parse_mode: 'Markdown' }
    )
  } catch (error) {
    console.error('❌ Next milestone error:', error)
    await ctx.reply('❌ Failed to load milestone data.')
  }
}
