"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.freezeDevWallet = freezeDevWallet;
exports.checkFreezeStatus = checkFreezeStatus;
exports.verifyFreeze = verifyFreeze;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bs58_1 = __importDefault(require("bs58"));
const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
/**
 * Freeze dev wallet by removing token account authority
 * This makes it IMPOSSIBLE for the wallet to transfer tokens
 * WARNING: This is IRREVERSIBLE!
 */
async function freezeDevWallet(walletPrivateKey, tokenAccountAddress) {
    try {
        const wallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(walletPrivateKey));
        const tokenAccount = new web3_js_1.PublicKey(tokenAccountAddress);
        console.log('🔒 Executing Freeze Protocol...');
        console.log(`Token Account: ${tokenAccountAddress}`);
        console.log(`Current Authority: ${wallet.publicKey.toBase58()}`);
        // Remove authority - set it to null (irreversible)
        const signature = await (0, spl_token_1.setAuthority)(connection, wallet, // payer
        tokenAccount, // account to freeze
        wallet.publicKey, // current authority
        spl_token_1.AuthorityType.AccountOwner, // authority type
        null, // new authority (null = permanent freeze)
        [], // additional signers
        undefined, // confirm options
        spl_token_1.TOKEN_PROGRAM_ID);
        console.log('⏳ Confirming freeze transaction...');
        await connection.confirmTransaction(signature, 'confirmed');
        console.log('✅ Freeze Protocol executed successfully!');
        console.log(`Signature: ${signature}`);
        return signature;
    }
    catch (error) {
        console.error('❌ Freeze execution failed:', error);
        throw new Error(`Failed to freeze wallet: ${error}`);
    }
}
/**
 * Check if a token account is frozen
 */
async function checkFreezeStatus(tokenAccountAddress) {
    try {
        const tokenAccount = new web3_js_1.PublicKey(tokenAccountAddress);
        // Get token account info
        const accountInfo = await (0, spl_token_1.getAccount)(connection, tokenAccount);
        // Check if owner authority is null (frozen)
        const isFrozen = accountInfo.owner.toString() === '11111111111111111111111111111111';
        return {
            frozen: isFrozen,
            account: tokenAccountAddress,
            authority: isFrozen ? null : accountInfo.owner.toString()
        };
    }
    catch (error) {
        console.error('Error checking freeze status:', error);
        return {
            frozen: false,
            error: error.message || String(error)
        };
    }
}
/**
 * Verify freeze on-chain (double-check)
 */
async function verifyFreeze(tokenAccountAddress) {
    const status = await checkFreezeStatus(tokenAccountAddress);
    return status.frozen;
}
//# sourceMappingURL=freeze.js.map