"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wallet = exports.connection = void 0;
exports.getBalance = getBalance;
exports.getWalletAddress = getWalletAddress;
exports.initWallet = initWallet;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const connection = new web3_js_1.Connection('https://api.devnet.solana.com', 'confirmed');
exports.connection = connection;
let wallet;
let walletInitialized = false;
async function initWallet() {
    if (walletInitialized)
        return;
    // Load or generate wallet
    if (process.env.SOLANA_PRIVATE_KEY) {
        exports.wallet = wallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(process.env.SOLANA_PRIVATE_KEY));
        console.log('✅ Loaded existing wallet:', wallet.publicKey.toBase58());
    }
    else {
        exports.wallet = wallet = web3_js_1.Keypair.generate();
        console.log('✅ Generated new wallet:', wallet.publicKey.toBase58());
        console.log('💡 Add to .env: SOLANA_PRIVATE_KEY=' + bs58_1.default.encode(wallet.secretKey));
        // Request airdrop
        try {
            console.log('💧 Requesting devnet airdrop...');
            const sig = await connection.requestAirdrop(wallet.publicKey, 2 * web3_js_1.LAMPORTS_PER_SOL);
            await connection.confirmTransaction(sig);
            console.log('✅ Airdrop complete!');
        }
        catch (error) {
            console.log('⚠️  Airdrop failed (rate limit). Request manually at https://faucet.solana.com');
        }
    }
    walletInitialized = true;
}
async function getBalance() {
    await initWallet();
    const balance = await connection.getBalance(wallet.publicKey);
    return balance / web3_js_1.LAMPORTS_PER_SOL;
}
function getWalletAddress() {
    if (!walletInitialized) {
        throw new Error('Wallet not initialized. Call getBalance() first.');
    }
    return wallet.publicKey.toBase58();
}
//# sourceMappingURL=solana.js.map