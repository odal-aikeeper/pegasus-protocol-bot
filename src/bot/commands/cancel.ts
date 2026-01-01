import { Context } from 'telegraf'

export async function cancelCommand(ctx: Context) {
  await ctx.reply(
    `✅ *Cancelled*\n\n` +
    `All active operations have been cancelled.\n\n` +
    `You can start fresh with any command. Try /help to see available commands.`,
    { parse_mode: 'Markdown' }
  )
}

// Export function to clear all conversation states
export function clearAllStates(telegramId: number) {
  // This will be called by the cancel command
  // Individual handlers will manage their own state clearing
}
