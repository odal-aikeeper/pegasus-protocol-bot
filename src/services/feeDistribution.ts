import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed')

export interface FeeDistribution {
  buybackAmount: number
  creatorAmount: number
  lotteryAmount: number
}

export function calculateFees(totalAmount: number): FeeDistribution {
  const buybackPercentage = parseFloat(process.env.BUYBACK_PERCENTAGE || '70') / 100
  const creatorPercentage = parseFloat(process.env.CREATOR_FEE_PERCENTAGE || '20') / 100
  const lotteryPercentage = parseFloat(process.env.LOTTERY_PERCENTAGE || '10') / 100
  
  return {
    buybackAmount: totalAmount * buybackPercentage,
    creatorAmount: totalAmount * creatorPercentage,
    lotteryAmount: totalAmount * lotteryPercentage
  }
}

export async function distributeCreatorFee(
  userWallet: Keypair,
  amount: number
): Promise<string | null> {
  const creatorWallet = process.env.CREATOR_WALLET
  
  if (!creatorWallet) {
    console.warn('⚠️ CREATOR_WALLET not set, skipping creator fee')
    return null
  }
  
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userWallet.publicKey,
        toPubkey: new PublicKey(creatorWallet),
        lamports: Math.floor(amount * LAMPORTS_PER_SOL)
      })
    )
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [userWallet])
    console.log(`✅ Creator fee sent: ${amount} SOL - ${signature}`)
    return signature
  } catch (error) {
    console.error('❌ Creator fee transfer failed:', error)
    throw new Error('Failed to send creator fee')
  }
}

export async function checkWalletBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error('Error checking wallet balance:', error)
    throw new Error('Failed to check wallet balance')
  }
}
