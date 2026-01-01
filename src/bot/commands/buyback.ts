import { Context, Markup } from 'telegraf'
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import bs58 from 'bs58'
import db from '../../database/db'
import { decrypt } from '../../utils/encryption'
import { executeSwap, getSwapQuote } from '../../services/jupiter/swap'
import { checkAndExecuteLottery } from '../../services/lottery/executeLottery'
import { calculateFees, distributeCreatorFee, checkWalletBalance } from '../../services/feeDistribution'
import { Telegraf } from 'telegraf'

const SOL_MINT = 'So11111111111111111111111111111111111111112'
const pendingBuybacks = new Map<number, { amount: number, quote: any }>()

export async function buybackCommand(ctx: Context) {
  const telegramId = ctx.from!.id
  const args = (ctx.message as any)?.text?.split(' ').slice(1)
  
  if (!args || args.length === 0) {
    await ctx.reply(
      `💰 *Execute Buyback*\n\n` +
      `Usage: /buyback <amount>\n\n` +
      `Example: \`/buyback 1.5\`\n\n` +
      `This will buy tokens using SOL from your linked wallet.`,
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  const amount = parseFloat(args[0])
  
  if (isNaN(amount) || amount <= 0) {
    await ctx.reply(`❌ Invalid amount. Please enter a positive number.`)
    return
  }
  
  // Check if user has linked wallet
  const user = db.prepare(
    'SELECT wallet_address, wallet_private_key_encrypted FROM users WHERE telegram_id = ?'
  ).get(telegramId) as any
  
  if (!user?.wallet_address || !user?.wallet_private_key_encrypted) {
    await ctx.reply(
      `❌ *No Wallet Linked*\n\n` +
      `Please link your Solana wallet first using /link\\_wallet\n\n` +
      `This allows the bot to execute buybacks from your wallet.`,
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  const tokenMint = process.env.TOKEN_MINT_ADDRESS
  if (!tokenMint) {
    await ctx.reply(`❌ Token mint address not configured. Contact admin.`)
    return
  }
  
  try {
    // Check wallet balance first
    const userBalance = await checkWalletBalance(user.wallet_address)
    
    if (userBalance < amount) {
      await ctx.reply(
        `❌ *Insufficient Balance*\n\n` +
        `Your balance: ${userBalance.toFixed(4)} SOL\n` +
        `Required: ${amount} SOL\n\n` +
        `Please fund your wallet and try again.`,
        { parse_mode: 'Markdown' }
      )
      return
    }
    
    // Calculate fee distribution
    const fees = calculateFees(amount)
    
    // Get quote from Jupiter for buyback portion only
    await ctx.reply(`⏳ Processing buyback...\n\nThis may take a few moments. The pegasus is ascending! 🐴`)
    
    const buybackLamports = Math.floor(fees.buybackAmount * LAMPORTS_PER_SOL)
    const quote = await getSwapQuote(SOL_MINT, tokenMint, buybackLamports)
    
    const tokensOut = parseFloat(quote.outAmount) / 1e9 // Assuming 9 decimals
    const priceImpact = parseFloat(quote.priceImpactPct || 0)
    
    // Store pending buyback
    pendingBuybacks.set(telegramId, { amount, quote })
    
    const currentPrice = tokensOut > 0 ? fees.buybackAmount / tokensOut : 0
    
    await ctx.reply(
      `🔄 *Buyback Confirmation*\n\n` +
      `Total Amount: ${amount} SOL\n` +
      `Estimated tokens: ~${tokensOut.toFixed(2)}\n` +
      `Price per token: ${currentPrice.toFixed(6)}\n` +
      `Price impact: ${priceImpact.toFixed(2)}%\n\n` +
      `*Fee breakdown:*\n` +
      `• Buyback: ${fees.buybackAmount.toFixed(4)} SOL (70%)\n` +
      `• Creator: ${fees.creatorAmount.toFixed(4)} SOL (20%)\n` +
      `• Lottery pool: ${fees.lotteryAmount.toFixed(4)} SOL (10%)\n\n` +
      `⚠️ This will execute a real transaction on Solana.\n\n` +
      `Confirm this transaction?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Confirm', `confirm_buyback_${telegramId}`),
            Markup.button.callback('❌ Cancel', `cancel_buyback_${telegramId}`)
          ]
        ])
      }
    )
  } catch (error: any) {
    console.error('Buyback quote error:', error)
    
    let errorMsg = '❌ Failed to get quote.\n\n'
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMsg += 'Network error: Cannot reach Jupiter API.\n'
      errorMsg += 'Please check your internet connection and try again.'
    } else {
      errorMsg += `Error: ${error.message}\n\n`
      errorMsg += 'Please try again or contact support.'
    }
    
    await ctx.reply(errorMsg)
  }
}

export async function confirmBuyback(ctx: any, bot: Telegraf) {
  const telegramId = ctx.from!.id
  
  try {
    await ctx.answerCbQuery()
  } catch (e) {
    // Ignore old callback query errors
  }
  
  const pending = pendingBuybacks.get(telegramId)
  if (!pending) {
    await ctx.editMessageText(`❌ Buyback expired. Please start over with /buyback`)
    return
  }
  
  const { amount } = pending
  pendingBuybacks.delete(telegramId)
  
  try {
    await ctx.editMessageText(`⏳ Executing buyback...\n\nThis may take a few moments. The pegasus is ascending! 🐴`)
    
    // Get user's encrypted wallet
    const user = db.prepare(
      'SELECT wallet_private_key_encrypted FROM users WHERE telegram_id = ?'
    ).get(telegramId) as any
    
    // Decrypt private key
    const privateKeyBase58 = decrypt(user.wallet_private_key_encrypted)
    const wallet = Keypair.fromSecretKey(bs58.decode(privateKeyBase58))
    
    const tokenMint = process.env.TOKEN_MINT_ADDRESS!
    const fees = calculateFees(amount)
    
    console.log(`🔄 Executing buyback for user ${telegramId}: ${amount} SOL`)
    console.log(`Fee distribution: Buyback ${fees.buybackAmount}, Creator ${fees.creatorAmount}, Lottery ${fees.lotteryAmount}`)
    
    // Step 1: Send creator fee
    let creatorTx = null
    if (fees.creatorAmount > 0) {
      console.log('💰 Sending creator fee...')
      creatorTx = await distributeCreatorFee(wallet, fees.creatorAmount)
    }
    
    // Step 2: Execute swap with buyback portion
    const buybackLamports = Math.floor(fees.buybackAmount * LAMPORTS_PER_SOL)
    console.log('🔄 Executing Jupiter swap...')
    const swapSignature = await executeSwap(wallet, SOL_MINT, tokenMint, buybackLamports)
    
    // Step 3: Update database
    console.log('📊 Updating database...')
    
    // Update total volume
    db.prepare(
      'UPDATE buyback_volume SET total_volume = total_volume + ?, last_updated = strftime("%s", "now") WHERE id = 1'
    ).run(amount)
    
    // Update lottery pool (lottery fee stays in user's wallet, tracked in DB)
    db.prepare(
      'UPDATE lottery_pool SET current_amount = current_amount + ?, last_updated = strftime("%s", "now") WHERE id = 1'
    ).run(fees.lotteryAmount)
    
    // Record transaction
    const tokensReceived = 0 // Will be updated when we parse the transaction
    const executionPrice = 0
    db.prepare(
      'INSERT INTO buyback_transactions (amount_sol, amount_tokens, price, tx_signature) VALUES (?, ?, ?, ?)'
    ).run(amount, tokensReceived, executionPrice, swapSignature)
    
    // Step 4: Prepare success message
    const volume = db.prepare('SELECT total_volume FROM buyback_volume WHERE id = 1').get() as any
    const pool = db.prepare('SELECT current_amount FROM lottery_pool WHERE id = 1').get() as any
    
    const txLink = process.env.SOLANA_RPC_URL?.includes('devnet') 
      ? `https://solscan.io/tx/${swapSignature}?cluster=devnet`
      : `https://solscan.io/tx/${swapSignature}`
    
    let successMessage = `✅ *Buyback Executed!* 🐴\n\n`
    successMessage += `Amount: ${amount} SOL\n`
    successMessage += `Buyback TX: [View on Solscan](${txLink})\n\n`
    
    if (creatorTx) {
      const creatorTxLink = process.env.SOLANA_RPC_URL?.includes('devnet')
        ? `https://solscan.io/tx/${creatorTx}?cluster=devnet`
        : `https://solscan.io/tx/${creatorTx}`
      successMessage += `Creator Fee: ${fees.creatorAmount.toFixed(4)} SOL [TX](${creatorTxLink})\n`
    }
    
    successMessage += `\n*Results:*\n`
    successMessage += `Lottery pool: +${fees.lotteryAmount.toFixed(4)} SOL (now ${pool.current_amount.toFixed(2)} SOL)\n`
    successMessage += `Total volume: ${volume.total_volume.toFixed(2)} SOL\n\n`
    successMessage += `Keep ascending! ⬆️`
    
    await ctx.editMessageText(successMessage, { parse_mode: 'Markdown' })
    
    // Check if lottery should be executed
    setTimeout(() => {
      checkAndExecuteLottery(bot).catch(err => {
        console.error('Lottery check error:', err)
      })
    }, 2000)
    
  } catch (error: any) {
    console.error('Buyback execution error:', error)
    
    let errorMessage = `❌ *Buyback Failed*\n\n`
    
    if (error.message.includes('Insufficient')) {
      errorMessage += `Insufficient balance. Please check your wallet has enough SOL.\n\n`
    } else if (error.message.includes('Swap failed')) {
      errorMessage += `Swap execution failed. This could be due to:\n`
      errorMessage += `• Slippage too high\n`
      errorMessage += `• Insufficient liquidity\n`
      errorMessage += `• Network congestion\n\n`
    } else if (error.message.includes('creator fee')) {
      errorMessage += `Creator fee transfer failed. The swap was not executed.\n\n`
    } else {
      errorMessage += `Error: ${error.message}\n\n`
    }
    
    errorMessage += `Your funds are safe. Please try again or contact support.`
    
    await ctx.editMessageText(errorMessage, { parse_mode: 'Markdown' })
  }
}

export async function cancelBuyback(ctx: any) {
  const telegramId = ctx.from!.id
  try {
    await ctx.answerCbQuery()
  } catch (e) {
    // Ignore old callback query errors
  }
  
  pendingBuybacks.delete(telegramId)
  await ctx.editMessageText(`❌ Buyback cancelled.`)
}
