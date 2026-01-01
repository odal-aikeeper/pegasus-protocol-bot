"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bot_1 = __importDefault(require("./bot"));
const solana_1 = require("./services/solana");
const marketCapTracker_1 = require("./services/marketCapTracker");
async function start() {
    console.log('🐴 PEGASUS PROTOCOL BOT STARTING...\n');
    // Check wallet balance (this initializes the wallet)
    const balance = await (0, solana_1.getBalance)();
    const address = (0, solana_1.getWalletAddress)();
    console.log(`✅ Loaded existing wallet: ${address}`);
    console.log(`💰 Wallet balance: ${balance.toFixed(4)} SOL\n`);
    console.log('✅ Bot ready!\n');
    // Start market cap tracking
    (0, marketCapTracker_1.startMarketCapTracking)();
    await bot_1.default.launch();
}
start().catch(error => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
});
// Graceful shutdown
process.once('SIGINT', () => bot_1.default.stop('SIGINT'));
process.once('SIGTERM', () => bot_1.default.stop('SIGTERM'));
//# sourceMappingURL=index.js.map