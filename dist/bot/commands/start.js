"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = startCommand;
const telegraf_1 = require("telegraf");
const db_1 = __importDefault(require("../../database/db"));
async function startCommand(ctx) {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || 'Unknown';
    db_1.default.prepare('INSERT OR IGNORE INTO users (telegram_id, username) VALUES (?, ?)').run(telegramId, username);
    // Check freeze status for welcome message
    const freezeRecord = db_1.default.prepare('SELECT frozen FROM freeze_protocol WHERE frozen = 1 LIMIT 1').get();
    const freezeBadge = freezeRecord ? ' 🔒' : '';
    await ctx.reply(`🐴 *Welcome to Pegasus Protocol*${freezeBadge}

Your automated Solana buyback infrastructure with lottery rewards.

✨ Set up automated buybacks with price triggers
💎 Freeze mechanics for liquidity stability  
🎰 Win lottery rewards at volume milestones
📊 Track all your buyback activity

Type /help to see all available commands.

Ready to ascend? Let's go! ⬆️`, {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('📊 View Commands', 'help'),
                telegraf_1.Markup.button.callback('🎰 Check Lottery', 'lottery')
            ],
            [telegraf_1.Markup.button.callback('💰 Buy Now', 'buyback')]
        ])
    });
}
//# sourceMappingURL=start.js.map