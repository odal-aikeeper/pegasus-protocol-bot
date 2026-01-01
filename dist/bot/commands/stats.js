"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsCommand = statsCommand;
const db_1 = __importDefault(require("../../database/db"));
const marketCapTracker_1 = require("../../services/marketCapTracker");
async function statsCommand(ctx) {
    try {
        const txCount = db_1.default.prepare('SELECT COUNT(*) as count FROM buyback_transactions').get();
        const volume = db_1.default.prepare('SELECT total_volume FROM buyback_volume WHERE id = 1').get();
        const pool = db_1.default.prepare('SELECT * FROM lottery_pool WHERE id = 1').get();
        const triggers = db_1.default.prepare('SELECT COUNT(*) as count FROM price_triggers WHERE is_active = 1').get();
        const avgPrice = db_1.default.prepare('SELECT AVG(price) as avg FROM buyback_transactions WHERE price > 0').get();
        const totalTokens = db_1.default.prepare('SELECT SUM(amount_tokens) as total FROM buyback_transactions').get();
        // Check freeze status
        const freezeRecord = db_1.default.prepare('SELECT frozen FROM freeze_protocol WHERE frozen = 1 LIMIT 1').get();
        const freezeStatus = freezeRecord ? '✅ LOCKED' : '⚠️ Not Frozen';
        const currentMC = pool?.current_market_cap || 0;
        const nextMilestone = pool?.next_milestone_market_cap || 30000;
        await ctx.reply(`📊 *Buyback Statistics*\n\n` +
            `Current Market Cap: *$${(0, marketCapTracker_1.formatMarketCap)(currentMC)}*\n` +
            `Total Buybacks: ${txCount?.count || 0}\n` +
            `Total SOL Spent: ${(volume?.total_volume || 0).toFixed(2)} SOL\n` +
            `Average Price: ${avgPrice?.avg ? avgPrice.avg.toFixed(6) : 'N/A'}\n\n` +
            `Lottery Pool: *${(pool?.current_amount || 0).toFixed(2)} SOL*\n` +
            `Next Milestone: *$${(0, marketCapTracker_1.formatMarketCap)(nextMilestone)}*\n\n` +
            `Active Triggers: ${triggers?.count || 0}\n` +
            `🔒 Freeze Status: ${freezeStatus}\n\n` +
            `The protocol ascends. ⬆️`, { parse_mode: 'Markdown' });
    }
    catch (error) {
        console.error('❌ Stats error:', error);
        await ctx.reply('❌ Failed to load statistics.');
    }
}
//# sourceMappingURL=stats.js.map