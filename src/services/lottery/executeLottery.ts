import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import db from '../../database/db'
import { wallet as botWallet } from '../solana'
import { Telegraf } from 'telegraf'

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed')

export async function checkAndExecuteLottery(bot: Telegraf) {
  const pool = db.prepare('SELECT * FROM lottery_pool WHERE id = 1').get() as any
  const volume = db.prepare('SELECT total_volume FROM buyback_volume WHERE id = 1').get() as any
  
  // Check if milestone reached
  if (volume.total_volume < pool.next_milestone) {
    return false
  }
  
  console.log('🎰 LOTTERY MILESTONE REACHED!')
  console.log(`Volume: ${volume.total_volume} SOL >= Milestone: ${pool.next_milestone} SOL`)
  
  try {
    // Get all token holders
    const tokenMint = process.env.TOKEN_MINT_ADDRESS
    if (!tokenMint) {
      console.error('TOKEN_MINT_ADDRESS not set')
      return false
    }
    
    const holders = await getTokenHolders(tokenMint)
    
    if (holders.length === 0) {
      console.log('No eligible holders found')
      return false
    }
    
    // Select random winner
    const winner = holders[Math.floor(Math.random() * holders.length)]
    
    console.log(`🎉 Winner selected: ${winner.address}`)
    console.log(`Prize: ${pool.current_amount} SOL`)
    
    // Execute payout from bot wallet
    const signature = await sendLotteryPayout(winner.address, pool.current_amount)
    
    // Record winner in database
    db.prepare(
      'INSERT INTO lottery_winners (milestone, winner_wallet, amount) VALUES (?, ?, ?)'
    ).run(pool.next_milestone, winner.address, pool.current_amount)
    
    // Update lottery pool - reset and increase milestone
    const newMilestone = pool.next_milestone + 30000
    db.prepare(
      'UPDATE lottery_pool SET current_amount = 0, next_milestone = ? WHERE id = 1'
    ).run(newMilestone)
    
    // Announce winner
    await announceWinner(bot, winner.address, pool.current_amount, signature)
    
    return true
  } catch (error) {
    console.error('Lottery execution error:', error)
    return false
  }
}

async function getTokenHolders(tokenMint: string): Promise<Array<{address: string, balance: number}>> {
  try {
    const mintPubkey = new PublicKey(tokenMint)
    const minHolderTokens = parseFloat(process.env.MIN_HOLDER_TOKENS || '1000')
    
    // Get all token accounts for this mint
    const accounts = await connection.getProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: mintPubkey.toBase58() } }
        ]
      }
    )
    
    const holders: Array<{address: string, balance: number}> = []
    
    for (const account of accounts) {
      const balance = Number(account.account.data.readBigUInt64LE(64))
      
      if (balance >= minHolderTokens) {
        // Get owner address
        const owner = new PublicKey(account.account.data.slice(32, 64))
        holders.push({
          address: owner.toBase58(),
          balance
        })
      }
    }
    
    console.log(`Found ${holders.length} eligible holders (min ${minHolderTokens} tokens)`)
    return holders
  } catch (error) {
    console.error('Error fetching token holders:', error)
    return []
  }
}

async function sendLotteryPayout(winnerAddress: string, amount: number): Promise<string> {
  const { SystemProgram, Transaction, sendAndConfirmTransaction } = await import('@solana/web3.js')
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: botWallet.publicKey,
      toPubkey: new PublicKey(winnerAddress),
      lamports: Math.floor(amount * LAMPORTS_PER_SOL)
    })
  )
  
  const signature = await sendAndConfirmTransaction(connection, transaction, [botWallet])
  
  console.log(`✅ Lottery payout sent: ${signature}`)
  return signature
}

async function announceWinner(bot: Telegraf, winnerAddress: string, amount: number, signature: string) {
  const shortAddress = `${winnerAddress.slice(0, 4)}...${winnerAddress.slice(-4)}`
  const txLink = process.env.SOLANA_RPC_URL?.includes('devnet')
    ? `https://solscan.io/tx/${signature}?cluster=devnet`
    : `https://solscan.io/tx/${signature}`
  
  const message = `
🎰 *PEGASUS LOTTERY WINNER!* 🎉

Congratulations to the lucky winner!

Winner: \`${shortAddress}\`
Prize: *${amount.toFixed(2)} SOL* 💰

Transaction: [View on Solscan](${txLink})

The pegasus ascends! Next milestone incoming... 🐴✨
  `.trim()
  
  // Send to all users
  const users = db.prepare('SELECT telegram_id FROM users').all() as any[]
  
  for (const user of users) {
    try {
      await bot.telegram.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' })
    } catch (error) {
      console.error(`Failed to send announcement to ${user.telegram_id}:`, error)
    }
  }
}
