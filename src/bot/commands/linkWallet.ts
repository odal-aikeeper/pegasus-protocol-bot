import { Context } from 'telegraf'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import db from '../../database/db'
import { encrypt } from '../../utils/encryption'

const awaitingWalletLink = new Map<number, boolean>()

export async function linkWalletCommand(ctx: Context) {
  const telegramId = ctx.from!.id
  
  // Check if user already has a wallet
  const user = db.prepare('SELECT wallet_address FROM users WHERE telegram_id = ?').get(telegramId) as any
  
  if (user?.wallet_address) {
    await ctx.reply(
      `⚠️ You already have a wallet linked!\n\n` +
      `Address: ${user.wallet_address}\n\n` +
      `Use /unlink_wallet to remove it first.`
    )
    return
  }
  
  awaitingWalletLink.set(telegramId, true)
  
  await ctx.reply(
    `🔑 *Link Your Wallet*\n\n` +
    `⚠️ *SECURITY WARNING:*\n` +
    `• Your private key will be encrypted and stored securely\n` +
    `• NEVER share your key with anyone else\n` +
    `• This bot is non-custodial - you control your funds\n` +
    `• Test with small amounts first\n\n` +
    `Please send your Solana private key in the next message.\n` +
    `(Base58 format - the long string from your wallet)\n\n` +
    `Type /cancel to abort.`,
    { parse_mode: 'Markdown' }
  )
}

export async function handleWalletLinkMessage(ctx: Context) {
  const telegramId = ctx.from!.id
  
  if (!awaitingWalletLink.get(telegramId)) {
    return false // Not waiting for wallet link
  }
  
  const messageText = (ctx.message as any)?.text
  
  if (!messageText) {
    return false
  }
  
  // Ignore commands - let them be handled by command handlers
  if (messageText.startsWith('/')) {
    awaitingWalletLink.delete(telegramId)
    return false
  }
  
  // Check for cancel
  if (messageText === '/cancel') {
    awaitingWalletLink.delete(telegramId)
    await ctx.reply('❌ Wallet linking cancelled.')
    return true
  }
  
  try {
    // Delete the message containing the private key immediately
    try {
      await ctx.deleteMessage()
    } catch (e) {
      console.warn('Could not delete message (bot may not have permission)')
    }
    
    // Validate and parse the private key
    const privateKeyBytes = bs58.decode(messageText.trim())
    const wallet = Keypair.fromSecretKey(privateKeyBytes)
    const walletAddress = wallet.publicKey.toBase58()
    
    // Encrypt the private key
    const encryptedKey = encrypt(messageText.trim())
    
    // Store in database
    db.prepare(
      'UPDATE users SET wallet_address = ?, wallet_private_key_encrypted = ? WHERE telegram_id = ?'
    ).run(walletAddress, encryptedKey, telegramId)
    
    awaitingWalletLink.delete(telegramId)
    
    const shortAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    
    await ctx.reply(
      `✅ *Wallet Linked Successfully!*\n\n` +
      `Wallet: \`${shortAddress}\`\n\n` +
      `You can now execute buybacks from your wallet!\n\n` +
      `Your key is encrypted and secure. 🔒`,
      { parse_mode: 'Markdown' }
    )
    
    return true
  } catch (error) {
    console.error('Wallet link error:', error)
    await ctx.reply(
      `❌ Invalid Private Key\n\n` +
      `Please make sure you're sending a valid Solana private key in base58 format.\n\n` +
      `Try again or type /cancel to cancel.`
    )
    return true
  }
}

export async function myWalletCommand(ctx: Context) {
  const telegramId = ctx.from!.id
  const user = db.prepare('SELECT wallet_address FROM users WHERE telegram_id = ?').get(telegramId) as any
  
  if (!user?.wallet_address) {
    await ctx.reply(
      `❌ No wallet linked.\n\n` +
      `Use /link\\_wallet to link your Solana wallet.`,
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  const shortAddress = `${user.wallet_address.slice(0, 4)}...${user.wallet_address.slice(-4)}`
  
  await ctx.reply(
    `💎 *Your Wallet*\n\n` +
    `Address: \`${shortAddress}\`\n\n` +
    `Status: 🟢 Connected\n\n` +
    `Ready to ascend! 🐴`,
    { parse_mode: 'Markdown' }
  )
}

export async function unlinkWalletCommand(ctx: Context) {
  const telegramId = ctx.from!.id
  const user = db.prepare('SELECT wallet_address FROM users WHERE telegram_id = ?').get(telegramId) as any
  
  if (!user?.wallet_address) {
    await ctx.reply(`❌ No wallet linked.`)
    return
  }
  
  // Remove wallet from database
  db.prepare(
    'UPDATE users SET wallet_address = NULL, wallet_private_key_encrypted = NULL WHERE telegram_id = ?'
  ).run(telegramId)
  
  await ctx.reply(
    `✅ *Wallet Unlinked*\n\n` +
    `Your wallet has been removed from the bot.\n\n` +
    `Use /link_wallet to link a new wallet.`,
    { parse_mode: 'Markdown' }
  )
}
