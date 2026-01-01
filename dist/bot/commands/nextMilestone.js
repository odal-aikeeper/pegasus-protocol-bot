"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextMilestoneCommand = nextMilestoneCommand;
const db_1 = __importDefault(require("../../database/db"));
const marketCapTracker_1 = require("../../services/marketCapTracker");
async function nextMilestoneCommand(ctx) {
    try {
        const pool = db_1.default.prepare('SELECT * FROM lottery_pool WHERE id = 1').get();
        if (!pool) {
            await ctx.reply('⚠️ Lottery not initialized yet.');
            return;
        }
        const currentMC = pool.current_market_cap || 0;
        const nextMilestone = pool.next_milestone_market_cap || 30000;
        const remaining = Math.max(nextMilestone - currentMC, 0);
        const percentage = Math.min((currentMC / nextMilestone) * 100, 100);
        const progressBar = (0, marketCapTracker_1.createProgressBar)(percentage);
        await ctx.reply(`🎯 *Next Lottery Milestone*\n\n` +
            `Target: *$${(0, marketCapTracker_1.formatMarketCap)(nextMilestone)} Market Cap*\n` +
            `Current: *$${(0, marketCapTracker_1.formatMarketCap)(currentMC)}*\n` +
            `Remaining: *$${(0, marketCapTracker_1.formatMarketCap)(remaining)}*\n\n` +
            `Progress: ${progressBar} ${percentage.toFixed(1)}%\n\n` +
            `Keep ascending! 🐴✨`, { parse_mode: 'Markdown' });
    }
    catch (error) {
        console.error('❌ Next milestone error:', error);
        await ctx.reply('❌ Failed to load milestone data.');
    }
}
//# sourceMappingURL=nextMilestone.js.map