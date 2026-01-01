"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndExecuteLottery = checkAndExecuteLottery;
const web3_js_1 = require("@solana/web3.js");
const db_1 = __importDefault(require("../../database/db"));
const solana_1 = require("../solana");
const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
async function checkAndExecuteLottery(bot) {
    const pool = db_1.default.prepare('SELECT * FROM lottery_pool WHERE id = 1').get();
    const volume = db_1.default.prepare('SELECT total_volume FROM buyback_volume WHERE id = 1').get();
    // Check if milestone reached
    if (volume.total_volume < pool.next_milestone) {
        return false;
    }
    console.log('🎰 LOTTERY MILESTONE REACHED!');
    console.log(`Volume: ${volume.total_volume} SOL >= Milestone: ${pool.next_milestone} SOL`);
    try {
        // Get all token holders
        const tokenMint = process.env.TOKEN_MINT_ADDRESS;
        if (!tokenMint) {
            console.error('TOKEN_MINT_ADDRESS not set');
            return false;
        }
        const holders = await getTokenHolders(tokenMint);
        if (holders.length === 0) {
            console.log('No eligible holders found');
            return false;
        }
        // Select random winner
        const winner = holders[Math.floor(Math.random() * holders.length)];
        console.log(`🎉 Winner selected: ${winner.address}`);
        console.log(`Prize: ${pool.current_amount} SOL`);
        // Execute payout from bot wallet
        const signature = await sendLotteryPayout(winner.address, pool.current_amount);
        // Record winner in database
        db_1.default.prepare('INSERT INTO lottery_winners (milestone, winner_wallet, amount) VALUES (?, ?, ?)').run(pool.next_milestone, winner.address, pool.current_amount);
        // Update lottery pool - reset and increase milestone
        const newMilestone = pool.next_milestone + 30000;
        db_1.default.prepare('UPDATE lottery_pool SET current_amount = 0, next_milestone = ? WHERE id = 1').run(newMilestone);
        // Announce winner
        await announceWinner(bot, winner.address, pool.current_amount, signature);
        return true;
    }
    catch (error) {
        console.error('Lottery execution error:', error);
        return false;
    }
}
async function getTokenHolders(tokenMint) {
    try {
        const mintPubkey = new web3_js_1.PublicKey(tokenMint);
        const minHolderTokens = parseFloat(process.env.MIN_HOLDER_TOKENS || '1000');
        // Get all token accounts for this mint
        const accounts = await connection.getProgramAccounts(new web3_js_1.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), {
            filters: [
                { dataSize: 165 },
                { memcmp: { offset: 0, bytes: mintPubkey.toBase58() } }
            ]
        });
        const holders = [];
        for (const account of accounts) {
            const balance = Number(account.account.data.readBigUInt64LE(64));
            if (balance >= minHolderTokens) {
                // Get owner address
                const owner = new web3_js_1.PublicKey(account.account.data.slice(32, 64));
                holders.push({
                    address: owner.toBase58(),
                    balance
                });
            }
        }
        console.log(`Found ${holders.length} eligible holders (min ${minHolderTokens} tokens)`);
        return holders;
    }
    catch (error) {
        console.error('Error fetching token holders:', error);
        return [];
    }
}
async function sendLotteryPayout(winnerAddress, amount) {
    const { SystemProgram, Transaction, sendAndConfirmTransaction } = await Promise.resolve().then(() => __importStar(require('@solana/web3.js')));
    const transaction = new Transaction().add(SystemProgram.transfer({
        fromPubkey: solana_1.wallet.publicKey,
        toPubkey: new web3_js_1.PublicKey(winnerAddress),
        lamports: Math.floor(amount * web3_js_1.LAMPORTS_PER_SOL)
    }));
    const signature = await sendAndConfirmTransaction(connection, transaction, [solana_1.wallet]);
    console.log(`✅ Lottery payout sent: ${signature}`);
    return signature;
}
async function announceWinner(bot, winnerAddress, amount, signature) {
    const shortAddress = `${winnerAddress.slice(0, 4)}...${winnerAddress.slice(-4)}`;
    const txLink = process.env.SOLANA_RPC_URL?.includes('devnet')
        ? `https://solscan.io/tx/${signature}?cluster=devnet`
        : `https://solscan.io/tx/${signature}`;
    const message = `
🎰 *PEGASUS LOTTERY WINNER!* 🎉

Congratulations to the lucky winner!

Winner: \`${shortAddress}\`
Prize: *${amount.toFixed(2)} SOL* 💰

Transaction: [View on Solscan](${txLink})

The pegasus ascends! Next milestone incoming... 🐴✨
  `.trim();
    // Send to all users
    const users = db_1.default.prepare('SELECT telegram_id FROM users').all();
    for (const user of users) {
        try {
            await bot.telegram.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
        }
        catch (error) {
            console.error(`Failed to send announcement to ${user.telegram_id}:`, error);
        }
    }
}
//# sourceMappingURL=executeLottery.js.map