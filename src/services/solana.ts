import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import bs58 from 'bs58'

const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

let wallet: Keypair
let walletInitialized = false

async function initWallet() {
  if (walletInitialized) return
  
  // Load or generate wallet
  if (process.env.SOLANA_PRIVATE_KEY) {
    wallet = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_PRIVATE_KEY))
    console.log('✅ Loaded existing wallet:', wallet.publicKey.toBase58())
  } else {
    wallet = Keypair.generate()
    console.log('✅ Generated new wallet:', wallet.publicKey.toBase58())
    console.log('💡 Add to .env: SOLANA_PRIVATE_KEY=' + bs58.encode(wallet.secretKey))
    
    // Request airdrop
    try {
      console.log('💧 Requesting devnet airdrop...')
      const sig = await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL)
      await connection.confirmTransaction(sig)
      console.log('✅ Airdrop complete!')
    } catch (error) {
      console.log('⚠️  Airdrop failed (rate limit). Request manually at https://faucet.solana.com')
    }
  }
  
  walletInitialized = true
}

export async function getBalance(): Promise<number> {
  await initWallet()
  const balance = await connection.getBalance(wallet.publicKey)
  return balance / LAMPORTS_PER_SOL
}

export function getWalletAddress(): string {
  if (!walletInitialized) {
    throw new Error('Wallet not initialized. Call getBalance() first.')
  }
  return wallet.publicKey.toBase58()
}

export { connection, wallet, initWallet }
