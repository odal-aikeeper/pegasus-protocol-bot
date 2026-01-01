"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buybackCommand = buybackCommand;
exports.confirmBuyback = confirmBuyback;
exports.cancelBuyback = cancelBuyback;
const telegraf_1 = require("telegraf");
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const db_1 = __importDefault(require("../../database/db"));
const encryption_1 = require("../../utils/encryption");
const swap_1 = require("../../services/jupiter/swap");
const executeLottery_1 = require("../../services/lottery/executeLottery");
const feeDistribution_1 = require("../../services/feeDistribution");
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const pendingBuybacks = new Map();
async function buybackCommand(ctx) {
    const telegramId = ctx.from.id;
    const args = ctx.message?.text?.split(' ').slice(1);
    if (!args || args.length === 0) {
        await ctx.reply(`💰 *Execute Buyback*\n\n` +
            `Usage: /buyback <amount>\n\n` +
            `Example: \`/buyback 1.5\`\n\n` +
            `This will buy tokens using SOL from your linked wallet.`, { parse_mode: 'Markdown' });
        return;
    }
    const amount = parseFloat(args[0]);
    if (isNaN(amount) || amount <= 0) {
        await ctx.reply(`❌ Invalid amount. Please enter a positive number.`);
        return;
    }
    // Check if user has linked wallet
    const user = db_1.default.prepare('SELECT wallet_address, wallet_private_key_encrypted FROM users WHERE telegram_id = ?').get(telegramId);
    if (!user?.wallet_address || !user?.wallet_private_key_encrypted) {
        await ctx.reply(`❌ *No Wallet Linked*\n\n` +
            `Please link your Solana wallet first using /link\\_wallet\n\n` +
            `This allows the bot to execute buybacks from your wallet.`, { parse_mode: 'Markdown' });
        return;
    }
    const tokenMint = process.env.TOKEN_MINT_ADDRESS;
    if (!tokenMint) {
        await ctx.reply(`❌ Token mint address not configured. Contact admin.`);
        return;
    }
    try {
        // Check wallet balance first
        const userBalance = await (0, feeDistribution_1.checkWalletBalance)(user.wallet_address);
        if (userBalance < amount) {
            await ctx.reply(`❌ *Insufficient Balance*\n\n` +
                `Your balance: ${userBalance.toFixed(4)} SOL\n` +
                `Required: ${amount} SOL\n\n` +
                `Please fund your wallet and try again.`, { parse_mode: 'Markdown' });
            return;
        }
        // Calculate fee distribution
        const fees = (0, feeDistribution_1.calculateFees)(amount);
        // Get quote from Jupiter for buyback portion only
        await ctx.reply(`⏳ Processing buyback...\n\nThis may take a few moments. The pegasus is ascending! 🐴`);
        const buybackLamports = Math.floor(fees.buybackAmount * web3_js_1.LAMPORTS_PER_SOL);
        const quote = await (0, swap_1.getSwapQuote)(SOL_MINT, tokenMint, buybackLamports);
        const tokensOut = parseFloat(quote.outAmount) / 1e9; // Assuming 9 decimals
        const priceImpact = parseFloat(quote.priceImpactPct || 0);
        // Store pending buyback
        pendingBuybacks.set(telegramId, { amount, quote });
        const currentPrice = tokensOut > 0 ? fees.buybackAmount / tokensOut : 0;
        await ctx.reply(`🔄 *Buyback Confirmation*\n\n` +
            `Total Amount: ${amount} SOL\n` +
            `Estimated tokens: ~${tokensOut.toFixed(2)}\n` +
            `Price per token: ${currentPrice.toFixed(6)}\n` +
            `Price impact: ${priceImpact.toFixed(2)}%\n\n` +
            `*Fee breakdown:*\n` +
            `• Buyback: ${fees.buybackAmount.toFixed(4)} SOL (70%)\n` +
            `• Creator: ${fees.creatorAmount.toFixed(4)} SOL (20%)\n` +
            `• Lottery pool: ${fees.lotteryAmount.toFixed(4)} SOL (10%)\n\n` +
            `⚠️ This will execute a real transaction on Solana.\n\n` +
            `Confirm this transaction?`, {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback('✅ Confirm', `confirm_buyback_${telegramId}`),
                    telegraf_1.Markup.button.callback('❌ Cancel', `cancel_buyback_${telegramId}`)
                ]
            ])
        });
    }
    catch (error) {
        console.error('Buyback quote error:', error);
        let errorMsg = '❌ Failed to get quote.\n\n';
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMsg += 'Network error: Cannot reach Jupiter API.\n';
            errorMsg += 'Please check your internet connection and try again.';
        }
        else {
            errorMsg += `Error: ${error.message}\n\n`;
            errorMsg += 'Please try again or contact support.';
        }
        await ctx.reply(errorMsg);
    }
}
async function confirmBuyback(ctx, bot) {
    const telegramId = ctx.from.id;
    try {
        await ctx.answerCbQuery();
    }
    catch (e) {
        // Ignore old callback query errors
    }
    const pending = pendingBuybacks.get(telegramId);
    if (!pending) {
        await ctx.editMessageText(`❌ Buyback expired. Please start over with /buyback`);
        return;
    }
    const { amount } = pending;
    pendingBuybacks.delete(telegramId);
    try {
        await ctx.editMessageText(`⏳ Executing buyback...\n\nThis may take a few moments. The pegasus is ascending! 🐴`);
        // Get user's encrypted wallet
        const user = db_1.default.prepare('SELECT wallet_private_key_encrypted FROM users WHERE telegram_id = ?').get(telegramId);
        // Decrypt private key
        const privateKeyBase58 = (0, encryption_1.decrypt)(user.wallet_private_key_encrypted);
        const wallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(privateKeyBase58));
        const tokenMint = process.env.TOKEN_MINT_ADDRESS;
        const fees = (0, feeDistribution_1.calculateFees)(amount);
        console.log(`🔄 Executing buyback for user ${telegramId}: ${amount} SOL`);
        console.log(`Fee distribution: Buyback ${fees.buybackAmount}, Creator ${fees.creatorAmount}, Lottery ${fees.lotteryAmount}`);
        // Step 1: Send creator fee
        let creatorTx = null;
        if (fees.creatorAmount > 0) {
            console.log('💰 Sending creator fee...');
            creatorTx = await (0, feeDistribution_1.distributeCreatorFee)(wallet, fees.creatorAmount);
        }
        // Step 2: Execute swap with buyback portion
        const buybackLamports = Math.floor(fees.buybackAmount * web3_js_1.LAMPORTS_PER_SOL);
        console.log('🔄 Executing Jupiter swap...');
        const swapSignature = await (0, swap_1.executeSwap)(wallet, SOL_MINT, tokenMint, buybackLamports);
        // Step 3: Update database
        console.log('📊 Updating database...');
        // Update total volume
        db_1.default.prepare('UPDATE buyback_volume SET total_volume = total_volume + ?, last_updated = strftime("%s", "now") WHERE id = 1').run(amount);
        // Update lottery pool (lottery fee stays in user's wallet, tracked in DB)
        db_1.default.prepare('UPDATE lottery_pool SET current_amount = current_amount + ?, last_updated = strftime("%s", "now") WHERE id = 1').run(fees.lotteryAmount);
        // Record transaction
        const tokensReceived = 0; // Will be updated when we parse the transaction
        const executionPrice = 0;
        db_1.default.prepare('INSERT INTO buyback_transactions (amount_sol, amount_tokens, price, tx_signature) VALUES (?, ?, ?, ?)').run(amount, tokensReceived, executionPrice, swapSignature);
        // Step 4: Prepare success message
        const volume = db_1.default.prepare('SELECT total_volume FROM buyback_volume WHERE id = 1').get();
        const pool = db_1.default.prepare('SELECT current_amount FROM lottery_pool WHERE id = 1').get();
        const txLink = process.env.SOLANA_RPC_URL?.includes('devnet')
            ? `https://solscan.io/tx/${swapSignature}?cluster=devnet`
            : `https://solscan.io/tx/${swapSignature}`;
        let successMessage = `✅ *Buyback Executed!* 🐴\n\n`;
        successMessage += `Amount: ${amount} SOL\n`;
        successMessage += `Buyback TX: [View on Solscan](${txLink})\n\n`;
        if (creatorTx) {
            const creatorTxLink = process.env.SOLANA_RPC_URL?.includes('devnet')
                ? `https://solscan.io/tx/${creatorTx}?cluster=devnet`
                : `https://solscan.io/tx/${creatorTx}`;
            successMessage += `Creator Fee: ${fees.creatorAmount.toFixed(4)} SOL [TX](${creatorTxLink})\n`;
        }
        successMessage += `\n*Results:*\n`;
        successMessage += `Lottery pool: +${fees.lotteryAmount.toFixed(4)} SOL (now ${pool.current_amount.toFixed(2)} SOL)\n`;
        successMessage += `Total volume: ${volume.total_volume.toFixed(2)} SOL\n\n`;
        successMessage += `Keep ascending! ⬆️`;
        await ctx.editMessageText(successMessage, { parse_mode: 'Markdown' });
        // Check if lottery should be executed
        setTimeout(() => {
            (0, executeLottery_1.checkAndExecuteLottery)(bot).catch(err => {
                console.error('Lottery check error:', err);
            });
        }, 2000);
    }
    catch (error) {
        console.error('Buyback execution error:', error);
        let errorMessage = `❌ *Buyback Failed*\n\n`;
        if (error.message.includes('Insufficient')) {
            errorMessage += `Insufficient balance. Please check your wallet has enough SOL.\n\n`;
        }
        else if (error.message.includes('Swap failed')) {
            errorMessage += `Swap execution failed. This could be due to:\n`;
            errorMessage += `• Slippage too high\n`;
            errorMessage += `• Insufficient liquidity\n`;
            errorMessage += `• Network congestion\n\n`;
        }
        else if (error.message.includes('creator fee')) {
            errorMessage += `Creator fee transfer failed. The swap was not executed.\n\n`;
        }
        else {
            errorMessage += `Error: ${error.message}\n\n`;
        }
        errorMessage += `Your funds are safe. Please try again or contact support.`;
        await ctx.editMessageText(errorMessage, { parse_mode: 'Markdown' });
    }
}
async function cancelBuyback(ctx) {
    const telegramId = ctx.from.id;
    try {
        await ctx.answerCbQuery();
    }
    catch (e) {
        // Ignore old callback query errors
    }
    pendingBuybacks.delete(telegramId);
    await ctx.editMessageText(`❌ Buyback cancelled.`);
}
//# sourceMappingURL=buyback.js.map