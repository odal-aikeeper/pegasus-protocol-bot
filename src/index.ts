import 'dotenv/config'
import bot from './bot'
import { wallet, getWalletAddress, getBalance } from './services/solana'
import { startMarketCapTracking } from './services/marketCapTracker'

async function start() {
  console.log('🐴 PEGASUS PROTOCOL BOT STARTING...\n')
  
  // Check wallet balance (this initializes the wallet)
  const balance = await getBalance()
  const address = getWalletAddress()
  console.log(`✅ Loaded existing wallet: ${address}`)
  console.log(`💰 Wallet balance: ${balance.toFixed(4)} SOL\n`)
  
  console.log('✅ Bot ready!\n')
  
  // Start market cap tracking
  startMarketCapTracking()
  
  await bot.launch()
}

start().catch(error => {
  console.error('❌ Failed to start bot:', error)
  process.exit(1)
})

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
