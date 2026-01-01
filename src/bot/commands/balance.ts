import { Context, Markup } from 'telegraf'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import db from '../../database/db'

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed')

export async function balanceCommand(ctx: Context) {
  const telegramId = ctx.from!.id
  
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
    const publicKey = new PublicKey(user.wallet_address)
    const balance = await connection.getBalance(publicKey)
    const balanceSOL = balance / LAMPORTS_PER_SOL
    
    const shortAddress = `${user.wallet_address.slice(0, 4)}...${user.wallet_address.slice(-4)}`
    
    await ctx.reply(
      `💰 *Wallet Balance*

Wallet: \`${shortAddress}\` 
Balance: *${balanceSOL.toFixed(4)} SOL*

Ready to execute buybacks! 🐴`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('💰 Buy Tokens', 'buyback')],
          [Markup.button.callback('🎯 Set Trigger', 'auto_buyback')]
        ])
      }
    )
  } catch (error) {
    console.error('Balance check error:', error)
    await ctx.reply(
      `❌ Failed to fetch balance.\n\n` +
      `Please try again later.`
    )
  }
}
