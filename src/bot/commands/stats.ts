import { Context } from 'telegraf'
import db from '../../database/db'
import { formatMarketCap } from '../../services/marketCapTracker'

export async function statsCommand(ctx: Context) {
  try {
    const txCount = db.prepare('SELECT COUNT(*) as count FROM buyback_transactions').get() as any
    const volume = db.prepare('SELECT total_volume FROM buyback_volume WHERE id = 1').get() as any
    const pool = db.prepare('SELECT * FROM lottery_pool WHERE id = 1').get() as any
    const triggers = db.prepare('SELECT COUNT(*) as count FROM price_triggers WHERE is_active = 1').get() as any
    const avgPrice = db.prepare('SELECT AVG(price) as avg FROM buyback_transactions WHERE price > 0').get() as any
    const totalTokens = db.prepare('SELECT SUM(amount_tokens) as total FROM buyback_transactions').get() as any
    
    // Check freeze status
    const freezeRecord = db.prepare('SELECT frozen FROM freeze_protocol WHERE frozen = 1 LIMIT 1').get() as any
    const freezeStatus = freezeRecord ? '✅ LOCKED' : '⚠️ Not Frozen'
    
    const currentMC = pool?.current_market_cap || 0
    const nextMilestone = pool?.next_milestone_market_cap || 30000
    
    await ctx.reply(
      `📊 *Buyback Statistics*\n\n` +
      `Current Market Cap: *$${formatMarketCap(currentMC)}*\n` +
      `Total Buybacks: ${txCount?.count || 0}\n` +
      `Total SOL Spent: ${(volume?.total_volume || 0).toFixed(2)} SOL\n` +
      `Average Price: ${avgPrice?.avg ? avgPrice.avg.toFixed(6) : 'N/A'}\n\n` +
      `Lottery Pool: *${(pool?.current_amount || 0).toFixed(2)} SOL*\n` +
      `Next Milestone: *$${formatMarketCap(nextMilestone)}*\n\n` +
      `Active Triggers: ${triggers?.count || 0}\n` +
      `🔒 Freeze Status: ${freezeStatus}\n\n` +
      `The protocol ascends. ⬆️`,
      { parse_mode: 'Markdown' }
    )
  } catch (error) {
    console.error('❌ Stats error:', error)
    await ctx.reply('❌ Failed to load statistics.')
  }
}
