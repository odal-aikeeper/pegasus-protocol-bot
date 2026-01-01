import { Context } from 'telegraf'

export async function helpCommand(ctx: Context) {
  await ctx.reply(
    `🐴 *PEGASUS PROTOCOL Commands*

🔑 *WALLET COMMANDS:*
/link\\_wallet - Link your Solana wallet
/my\\_wallet - View wallet info & balance
/unlink\\_wallet - Remove linked wallet

💰 *BUYBACK COMMANDS:*
/balance - Check your SOL balance
/buyback <amount> - Execute manual buyback
  _Example: /buyback 1.5_
/auto\\_buyback <price> <amount> - Set price trigger
  _Example: /auto\\_buyback 0.05 2_
/cancel\\_trigger - Cancel active price triggers

🎰 *LOTTERY COMMANDS:*
/lottery - Current pool & next milestone
/lottery\\_history - View past winners
/next\\_milestone - Progress to next lottery

💎 *TRANSPARENCY:*
/freeze\\_status - Check dev wallet freeze status

📊 *STATS & INFO:*
/stats - View buyback statistics
/help - Show this message

Need help? Ascension awaits. 🐴✨`,
    { parse_mode: 'Markdown' }
  )
}
