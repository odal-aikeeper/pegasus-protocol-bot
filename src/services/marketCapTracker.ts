import { Connection, PublicKey } from '@solana/web3.js'
import db from '../database/db'

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed')

/**
 * Fetch current market cap from token supply and price
 */
export async function updateMarketCap(): Promise<number> {
  try {
    const tokenMint = process.env.TOKEN_MINT_ADDRESS
    
    if (!tokenMint || tokenMint === 'your_token_mint_address_here') {
      // Silently skip if not configured - don't spam logs
      return 0
    }
    
    // Validate it's a valid base58 address
    try {
      const mintPubkey = new PublicKey(tokenMint)
    } catch (err) {
      console.warn('⚠️ Invalid TOKEN_MINT_ADDRESS format, skipping market cap update')
      return 0
    }
    
    const mintPubkey = new PublicKey(tokenMint)
    
    // Get token supply
    const supply = await connection.getTokenSupply(mintPubkey)
    const totalSupply = parseFloat(supply.value.amount) / Math.pow(10, supply.value.decimals)
    
    // Get current price (placeholder - implement actual price fetching)
    const currentPrice = await getCurrentTokenPrice()
    
    // Calculate market cap
    const marketCap = totalSupply * currentPrice
    
    // Update database
    db.prepare(
      'UPDATE lottery_pool SET current_market_cap = ?, last_updated = strftime("%s", "now") WHERE id = 1'
    ).run(marketCap)
    
    console.log(`📊 Market cap updated: $${formatMarketCap(marketCap)}`)
    
    // Check if milestone reached
    await checkMilestoneReached()
    
    return marketCap
    
  } catch (error) {
    console.error('❌ Failed to update market cap:', error)
    return 0
  }
}

/**
 * Get current token price
 * TODO: Implement actual price fetching from DEX or bonding curve
 */
async function getCurrentTokenPrice(): Promise<number> {
  // Placeholder - you should implement actual price fetching
  // For Pump.fun tokens: fetch from bonding curve
  // For DEX tokens: fetch from Jupiter/Raydium price API
  
  // Example: Use Jupiter price API
  try {
    const tokenMint = process.env.TOKEN_MINT_ADDRESS
    if (!tokenMint) return 0
    
    // For now, return a placeholder
    // In production, fetch from: https://price.jup.ag/v4/price?ids=<TOKEN_MINT>
    return 0.00001 // Example price
  } catch (error) {
    console.error('Price fetch error:', error)
    return 0
  }
}

/**
 * Check if market cap milestone has been reached
 */
async function checkMilestoneReached() {
  const lottery = db.prepare('SELECT * FROM lottery_pool WHERE id = 1').get() as any
  
  if (!lottery) return
  
  const currentMC = lottery.current_market_cap || 0
  const milestone = lottery.next_milestone_market_cap || 30000
  
  if (currentMC >= milestone) {
    console.log(`🎰 MILESTONE REACHED! Market cap: $${formatMarketCap(currentMC)} >= $${formatMarketCap(milestone)}`)
    
    // TODO: Execute lottery draw
    // await executeLotteryDraw(lottery.current_amount)
    
    // Set next milestone
    const nextMilestone = getNextMilestone(milestone)
    
    db.prepare(
      'UPDATE lottery_pool SET next_milestone_market_cap = ? WHERE id = 1'
    ).run(nextMilestone)
    
    console.log(`🎯 Next milestone set to: $${formatMarketCap(nextMilestone)}`)
  }
}

/**
 * Calculate next milestone based on progression
 * 30k → 60k → 100k → 200k → 500k → 1M → 2M → 5M → 10M
 */
function getNextMilestone(current: number): number {
  if (current < 60000) return 60000
  if (current < 100000) return 100000
  if (current < 200000) return 200000
  if (current < 500000) return 500000
  if (current < 1000000) return 1000000
  if (current < 2000000) return 2000000
  if (current < 5000000) return 5000000
  if (current < 10000000) return 10000000
  return current * 2 // Double after 10M
}

/**
 * Format market cap for display
 */
export function formatMarketCap(mc: number): string {
  if (mc >= 1000000) return `${(mc / 1000000).toFixed(1)}M`
  if (mc >= 1000) return `${(mc / 1000).toFixed(0)}k`
  return mc.toFixed(0)
}

/**
 * Create progress bar for display
 */
export function createProgressBar(percentage: number): string {
  const filled = Math.floor(percentage / 10)
  const empty = 10 - filled
  return '▓'.repeat(filled) + '░'.repeat(empty)
}

/**
 * Start market cap tracking - updates every 5 minutes
 */
export function startMarketCapTracking() {
  const tokenMint = process.env.TOKEN_MINT_ADDRESS
  
  if (!tokenMint || tokenMint === 'your_token_mint_address_here') {
    console.log('📊 Market cap tracking disabled (TOKEN_MINT_ADDRESS not configured)')
    return
  }
  
  console.log('📊 Starting market cap tracking...')
  
  // Initial update
  updateMarketCap().catch(err => {
    console.error('Initial market cap update failed:', err)
  })
  
  // Update every 5 minutes
  setInterval(async () => {
    await updateMarketCap().catch(err => {
      // Silently handle errors to prevent spam
    })
  }, 5 * 60 * 1000)
}
