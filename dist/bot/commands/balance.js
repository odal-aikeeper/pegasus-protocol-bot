"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceCommand = balanceCommand;
const telegraf_1 = require("telegraf");
const web3_js_1 = require("@solana/web3.js");
const db_1 = __importDefault(require("../../database/db"));
const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
async function balanceCommand(ctx) {
    const telegramId = ctx.from.id;
    const user = db_1.default.prepare('SELECT wallet_address FROM users WHERE telegram_id = ?').get(telegramId);
    if (!user?.wallet_address) {
        await ctx.reply(`❌ *No Wallet Linked*\n\n` +
            `Please link your Solana wallet first using /link\\_wallet`, { parse_mode: 'Markdown' });
        return;
    }
    try {
        const publicKey = new web3_js_1.PublicKey(user.wallet_address);
        const balance = await connection.getBalance(publicKey);
        const balanceSOL = balance / web3_js_1.LAMPORTS_PER_SOL;
        const shortAddress = `${user.wallet_address.slice(0, 4)}...${user.wallet_address.slice(-4)}`;
        await ctx.reply(`💰 *Wallet Balance*

Wallet: \`${shortAddress}\` 
Balance: *${balanceSOL.toFixed(4)} SOL*

Ready to execute buybacks! 🐴`, {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('💰 Buy Tokens', 'buyback')],
                [telegraf_1.Markup.button.callback('🎯 Set Trigger', 'auto_buyback')]
            ])
        });
    }
    catch (error) {
        console.error('Balance check error:', error);
        await ctx.reply(`❌ Failed to fetch balance.\n\n` +
            `Please try again later.`);
    }
}
//# sourceMappingURL=balance.js.map