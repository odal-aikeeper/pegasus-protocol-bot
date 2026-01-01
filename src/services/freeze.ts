import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js'
import { setAuthority, AuthorityType, TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token'
import bs58 from 'bs58'

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed')

export interface FreezeStatus {
  frozen: boolean
  account?: string
  error?: string
  authority?: string | null
}

/**
 * Freeze dev wallet by removing token account authority
 * This makes it IMPOSSIBLE for the wallet to transfer tokens
 * WARNING: This is IRREVERSIBLE!
 */
export async function freezeDevWallet(
  walletPrivateKey: string,
  tokenAccountAddress: string
): Promise<string> {
  try {
    const wallet = Keypair.fromSecretKey(bs58.decode(walletPrivateKey))
    const tokenAccount = new PublicKey(tokenAccountAddress)
    
    console.log('🔒 Executing Freeze Protocol...')
    console.log(`Token Account: ${tokenAccountAddress}`)
    console.log(`Current Authority: ${wallet.publicKey.toBase58()}`)
    
    // Remove authority - set it to null (irreversible)
    const signature = await setAuthority(
      connection,
      wallet, // payer
      tokenAccount, // account to freeze
      wallet.publicKey, // current authority
      AuthorityType.AccountOwner, // authority type
      null, // new authority (null = permanent freeze)
      [], // additional signers
      undefined, // confirm options
      TOKEN_PROGRAM_ID
    )
    
    console.log('⏳ Confirming freeze transaction...')
    await connection.confirmTransaction(signature, 'confirmed')
    
    console.log('✅ Freeze Protocol executed successfully!')
    console.log(`Signature: ${signature}`)
    
    return signature
  } catch (error) {
    console.error('❌ Freeze execution failed:', error)
    throw new Error(`Failed to freeze wallet: ${error}`)
  }
}

/**
 * Check if a token account is frozen
 */
export async function checkFreezeStatus(tokenAccountAddress: string): Promise<FreezeStatus> {
  try {
    const tokenAccount = new PublicKey(tokenAccountAddress)
    
    // Get token account info
    const accountInfo = await getAccount(connection, tokenAccount)
    
    // Check if owner authority is null (frozen)
    const isFrozen = accountInfo.owner.toString() === '11111111111111111111111111111111'
    
    return {
      frozen: isFrozen,
      account: tokenAccountAddress,
      authority: isFrozen ? null : accountInfo.owner.toString()
    }
  } catch (error: any) {
    console.error('Error checking freeze status:', error)
    return {
      frozen: false,
      error: error.message || String(error)
    }
  }
}

/**
 * Verify freeze on-chain (double-check)
 */
export async function verifyFreeze(tokenAccountAddress: string): Promise<boolean> {
  const status = await checkFreezeStatus(tokenAccountAddress)
  return status.frozen
}
