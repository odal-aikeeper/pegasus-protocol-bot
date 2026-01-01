"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelCommand = cancelCommand;
exports.clearAllStates = clearAllStates;
async function cancelCommand(ctx) {
    await ctx.reply(`✅ *Cancelled*\n\n` +
        `All active operations have been cancelled.\n\n` +
        `You can start fresh with any command. Try /help to see available commands.`, { parse_mode: 'Markdown' });
}
// Export function to clear all conversation states
function clearAllStates(telegramId) {
    // This will be called by the cancel command
    // Individual handlers will manage their own state clearing
}
//# sourceMappingURL=cancel.js.map