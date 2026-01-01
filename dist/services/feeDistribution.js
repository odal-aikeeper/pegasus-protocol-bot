"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFees = calculateFees;
exports.distributeCreatorFee = distributeCreatorFee;
exports.checkWalletBalance = checkWalletBalance;
const web3_js_1 = require("@solana/web3.js");
const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
function calculateFees(totalAmount) {
    const buybackPercentage = parseFloat(process.env.BUYBACK_PERCENTAGE || '70') / 100;
    const creatorPercentage = parseFloat(process.env.CREATOR_FEE_PERCENTAGE || '20') / 100;
    const lotteryPercentage = parseFloat(process.env.LOTTERY_PERCENTAGE || '10') / 100;
    return {
        buybackAmount: totalAmount * buybackPercentage,
        creatorAmount: totalAmount * creatorPercentage,
        lotteryAmount: totalAmount * lotteryPercentage
    };
}
async function distributeCreatorFee(userWallet, amount) {
    const creatorWallet = process.env.CREATOR_WALLET;
    if (!creatorWallet) {
        console.warn('⚠️ CREATOR_WALLET not set, skipping creator fee');
        return null;
    }
    try {
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: userWallet.publicKey,
            toPubkey: new web3_js_1.PublicKey(creatorWallet),
            lamports: Math.floor(amount * web3_js_1.LAMPORTS_PER_SOL)
        }));
        const signature = await (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [userWallet]);
        console.log(`✅ Creator fee sent: ${amount} SOL - ${signature}`);
        return signature;
    }
    catch (error) {
        console.error('❌ Creator fee transfer failed:', error);
        throw new Error('Failed to send creator fee');
    }
}
async function checkWalletBalance(walletAddress) {
    try {
        const publicKey = new web3_js_1.PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);
        return balance / web3_js_1.LAMPORTS_PER_SOL;
    }
    catch (error) {
        console.error('Error checking wallet balance:', error);
        throw new Error('Failed to check wallet balance');
    }
}
//# sourceMappingURL=feeDistribution.js.map