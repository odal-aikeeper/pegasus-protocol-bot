"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSwapQuote = getSwapQuote;
exports.executeSwap = executeSwap;
exports.getTokenPrice = getTokenPrice;
const web3_js_1 = require("@solana/web3.js");
const axios_1 = __importDefault(require("axios"));
const SOL_MINT = 'So11111111111111111111111111111111111111112';
async function getSwapQuote(inputMint, outputMint, amount, slippageBps = 50) {
    try {
        const response = await axios_1.default.get('https://quote-api.jup.ag/v6/quote', {
            params: {
                inputMint,
                outputMint,
                amount,
                slippageBps
            }
        });
        return response.data;
    }
    catch (error) {
        console.error('Jupiter quote error:', error);
        throw new Error('Failed to get swap quote from Jupiter');
    }
}
async function executeSwap(wallet, inputMint, outputMint, amount, slippageBps = 50) {
    const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
    try {
        // 1. Get quote from Jupiter
        console.log('📊 Getting Jupiter quote...');
        const quoteResponse = await getSwapQuote(inputMint, outputMint, amount, slippageBps);
        console.log(`💰 Quote: ${amount} lamports → ${quoteResponse.outAmount} tokens`);
        // 2. Get swap transaction
        console.log('🔄 Building swap transaction...');
        const swapResponse = await axios_1.default.post('https://quote-api.jup.ag/v6/swap', {
            quoteResponse,
            userPublicKey: wallet.publicKey.toString(),
            wrapAndUnwrapSol: true,
            dynamicComputeUnitLimit: true,
            prioritizationFeeLamports: 'auto'
        });
        // 3. Deserialize and sign transaction
        console.log('✍️  Signing transaction...');
        const swapTransactionBuf = Buffer.from(swapResponse.data.swapTransaction, 'base64');
        const transaction = web3_js_1.VersionedTransaction.deserialize(swapTransactionBuf);
        transaction.sign([wallet]);
        // 4. Send transaction
        console.log('📤 Sending transaction...');
        const rawTransaction = transaction.serialize();
        const signature = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2
        });
        console.log('⏳ Confirming transaction...');
        await connection.confirmTransaction(signature, 'confirmed');
        console.log('✅ Swap successful! Signature:', signature);
        return signature;
    }
    catch (error) {
        console.error('❌ Swap execution error:', error.response?.data || error.message);
        throw new Error(`Swap failed: ${error.response?.data?.error || error.message}`);
    }
}
async function getTokenPrice(tokenMint) {
    try {
        // Get price from Jupiter price API
        const response = await axios_1.default.get(`https://price.jup.ag/v4/price?ids=${tokenMint}`);
        return response.data.data[tokenMint]?.price || 0;
    }
    catch (error) {
        console.error('Price fetch error:', error);
        return 0;
    }
}
//# sourceMappingURL=swap.js.map