"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelTriggerCommand = cancelTriggerCommand;
exports.handleCancelTrigger = handleCancelTrigger;
const telegraf_1 = require("telegraf");
const db_1 = __importDefault(require("../../database/db"));
async function cancelTriggerCommand(ctx) {
    const telegramId = ctx.from.id;
    const triggers = db_1.default.prepare('SELECT * FROM price_triggers WHERE telegram_id = ? AND is_active = 1').all(telegramId);
    if (triggers.length === 0) {
        await ctx.reply(`No active triggers found.

Set one with /auto_buyback`, { parse_mode: 'Markdown' });
        return;
    }
    let message = `🎯 *Active Price Triggers*\n\n`;
    const buttons = [];
    triggers.forEach((trigger, index) => {
        message += `${index + 1}. Buy ${trigger.amount_sol} SOL at ${trigger.trigger_price}\n`;
        buttons.push([
            telegraf_1.Markup.button.callback(`❌ Cancel Trigger ${index + 1}`, `cancel_trigger_${trigger.id}`)
        ]);
    });
    message += `\nTotal active: ${triggers.length}`;
    await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard(buttons)
    });
}
async function handleCancelTrigger(ctx) {
    try {
        await ctx.answerCbQuery();
    }
    catch (e) {
    }
    const triggerId = ctx.match[1];
    db_1.default.prepare('UPDATE price_triggers SET is_active = 0 WHERE id = ?').run(triggerId);
    await ctx.editMessageText(`✅ Price trigger cancelled successfully.`, { parse_mode: 'Markdown' });
}
//# sourceMappingURL=cancelTrigger.js.map