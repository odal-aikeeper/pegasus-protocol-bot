"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const db_1 = __importDefault(require("../database/db"));
const linkWallet_1 = require("./commands/linkWallet");
const buyback_1 = require("./commands/buyback");
const start_1 = require("./commands/start");
const help_1 = require("./commands/help");
const balance_1 = require("./commands/balance");
const stats_1 = require("./commands/stats");
const lottery_1 = require("./commands/lottery");
const lotteryHistory_1 = require("./commands/lotteryHistory");
const nextMilestone_1 = require("./commands/nextMilestone");
const autoBuyback_1 = require("./commands/autoBuyback");
const cancelTrigger_1 = require("./commands/cancelTrigger");
const freezeStatus_1 = require("./commands/freezeStatus");
const executeFreeze_1 = require("./commands/executeFreeze");
const cancel_1 = require("./commands/cancel");
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// Global error handler
bot.catch((err, ctx) => {
    console.error('❌ BOT ERROR:', err);
    console.error('Error details:', err.message);
    console.error('Update:', JSON.stringify(ctx.update, null, 2));
    try {
        ctx.reply('⚠️ An error occurred. Please try again or use /cancel to reset.').catch(console.error);
    }
    catch (e) {
        console.error('Failed to send error message:', e);
    }
});
// Log all incoming messages
bot.use((ctx, next) => {
    const text = ctx.message?.text || ctx.callbackQuery?.data;
    if (text) {
        console.log('📨 Incoming:', text, 'from user:', ctx.from?.id);
    }
    return next();
});
// Rate limiting
const userCooldown = new Map();
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId)
        return next();
    const now = Date.now();
    const last = userCooldown.get(userId) || 0;
    if (now - last < 1000)
        return;
    userCooldown.set(userId, now);
    return next();
});
// Text message handler for conversation flows (AFTER commands are registered)
bot.on('text', async (ctx, next) => {
    // Only process text if it's not a command
    const messageText = ctx.message.text;
    if (messageText.startsWith('/')) {
        return next(); // Let command handlers deal with it
    }
    // Check if user is in wallet linking flow
    const walletHandled = await (0, linkWallet_1.handleWalletLinkMessage)(ctx);
    if (walletHandled)
        return;
    // Check if user is in freeze confirmation flow
    const freezeHandled = await (0, executeFreeze_1.handleFreezeConfirmation)(ctx);
    if (freezeHandled)
        return;
    // If no handler processed it, continue
    return next();
});
// Command handlers (registered BEFORE text handlers)
bot.command('start', start_1.startCommand);
bot.command('help', help_1.helpCommand);
bot.command('cancel', cancel_1.cancelCommand);
bot.command('balance', balance_1.balanceCommand);
bot.command('lottery', lottery_1.lotteryCommand);
bot.command('stats', stats_1.statsCommand);
bot.command('lottery_history', lotteryHistory_1.lotteryHistoryCommand);
bot.command('next_milestone', nextMilestone_1.nextMilestoneCommand);
bot.command('auto_buyback', autoBuyback_1.autoBuybackCommand);
bot.command('cancel_trigger', cancelTrigger_1.cancelTriggerCommand);
// Freeze protocol commands
bot.command('freeze_status', freezeStatus_1.freezeStatusCommand);
bot.command('execute_freeze', executeFreeze_1.executeFreezeCommand);
// Wallet commands
bot.command('link_wallet', linkWallet_1.linkWalletCommand);
bot.command('my_wallet', linkWallet_1.myWalletCommand);
bot.command('unlink_wallet', linkWallet_1.unlinkWalletCommand);
// Buyback commands
bot.command('buyback', buyback_1.buybackCommand);
// Handle button callbacks
bot.action('help', async (ctx) => {
    try {
        await ctx.answerCbQuery();
    }
    catch (e) {
        // Ignore old callback query errors
    }
    try {
        await ctx.editMessageText(`🐴 *PEGASUS PROTOCOL Commands*

🔑 *WALLET COMMANDS:*
/link\_wallet - Link your Solana wallet
/my\_wallet - View wallet info & balance
/unlink\_wallet - Remove linked wallet

💰 *BUYBACK COMMANDS:*
/balance - Check your SOL balance
/buyback <amount> - Execute manual buyback
  _Example: /buyback 1.5_
/auto\_buyback <price> <amount> - Set price trigger
  _Example: /auto\_buyback 0.05 2_
/cancel\_trigger - Cancel active triggers

🎰 *LOTTERY COMMANDS:*
/lottery - Current pool & next milestone
/lottery\_history - View past winners
/next\_milestone - Progress to next lottery

📊 *STATS & INFO:*
/stats - View buyback statistics
/help - Show this message

Need help? Ascension awaits. 🐴✨`, { parse_mode: 'Markdown' });
    }
    catch (e) {
        console.error('Help callback error:', e);
    }
});
bot.action('lottery', async (ctx) => {
    try {
        await ctx.answerCbQuery();
    }
    catch (e) {
        // Ignore old callback query errors
    }
    try {
        const pool = db_1.default.prepare('SELECT * FROM lottery_pool WHERE id = 1').get();
        const volume = db_1.default.prepare('SELECT total_volume FROM buyback_volume WHERE id = 1').get();
        const progress = Math.min((volume.total_volume / pool.next_milestone) * 100, 100);
        const progressBar = '▓'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
        await ctx.editMessageText(`🎰 *PEGASUS LOTTERY*

Current Pool: *${pool.current_amount.toFixed(2)} SOL* 💰
Next Milestone: ${pool.next_milestone.toLocaleString()} SOL
Progress: [${progressBar}] ${progress.toFixed(1)}%

Volume climbing... Pool growing! 🐴✨`, { parse_mode: 'Markdown' });
    }
    catch (e) {
        console.error('Lottery callback error:', e);
    }
});
bot.action('buyback', async (ctx) => {
    try {
        await ctx.answerCbQuery();
    }
    catch (e) {
        // Ignore old callback query errors
    }
    try {
        await ctx.editMessageText(`💰 *Execute Buyback*

Use /buyback <amount> to execute a buyback.

Example: /buyback 1.5`, { parse_mode: 'Markdown' });
    }
    catch (e) {
        console.error('Buyback callback error:', e);
    }
});
bot.action('auto_buyback', async (ctx) => {
    try {
        await ctx.answerCbQuery();
    }
    catch (e) {
        // Ignore old callback query errors
    }
    try {
        await ctx.editMessageText(`🎯 *Set Price Trigger*

Use /auto\_buyback <price> <amount> to set a trigger.

Example: /auto\_buyback 0.05 2

The bot will execute when price reaches your target! 🐴`, { parse_mode: 'Markdown' });
    }
    catch (e) {
        console.error('Auto buyback callback error:', e);
    }
});
// Buyback confirmation callbacks
bot.action(/^confirm_buyback_(\d+)$/, async (ctx) => {
    await (0, buyback_1.confirmBuyback)(ctx, bot);
});
bot.action(/^cancel_buyback_(\d+)$/, async (ctx) => {
    await (0, buyback_1.cancelBuyback)(ctx);
});
// Cancel trigger callback
bot.action(/^cancel_trigger_(\d+)$/, async (ctx) => {
    await (0, cancelTrigger_1.handleCancelTrigger)(ctx);
});
exports.default = bot;
//# sourceMappingURL=index.js.map