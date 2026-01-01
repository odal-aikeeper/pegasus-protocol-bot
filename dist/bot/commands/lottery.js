"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lotteryCommand = lotteryCommand;
const db_1 = __importDefault(require("../../database/db"));
const marketCapTracker_1 = require("../../services/marketCapTracker");
async function lotteryCommand(ctx) {
    try {
        const pool = db_1.default.prepare('SELECT * FROM lottery_pool WHERE id = 1').get();
        if (!pool) {
            await ctx.reply('⚠️ Lottery not initialized yet.');
            return;
        }
        const poolAmount = (pool.current_amount || 0).toFixed(2);
        const currentMC = pool.current_market_cap || 0;
        const nextMilestone = pool.next_milestone_market_cap || 30000;
        const percentage = Math.min((currentMC / nextMilestone) * 100, 100);
        const progressBar = (0, marketCapTracker_1.createProgressBar)(percentage);
        await ctx.reply(`🎰 *PEGASUS LOTTERY*\n\n` +
            `Current Pool: *${poolAmount} SOL* 💰\n\n` +
            `Next Milestone: *$${(0, marketCapTracker_1.formatMarketCap)(nextMilestone)} Market Cap*\n` +
            `Current Market Cap: *$${(0, marketCapTracker_1.formatMarketCap)(currentMC)}*\n` +
            `Progress: ${progressBar} ${percentage.toFixed(1)}%\n\n` +
            `When we hit $${(0, marketCapTracker_1.formatMarketCap)(nextMilestone)} market cap, a random holder wins the entire pool!\n\n` +
            `Market cap climbing... Pool growing! 🐴✨`, { parse_mode: 'Markdown' });
    }
    catch (error) {
        console.error('❌ Lottery error:', error);
        await ctx.reply('❌ Failed to load lottery data.');
    }
}
//# sourceMappingURL=lottery.js.map