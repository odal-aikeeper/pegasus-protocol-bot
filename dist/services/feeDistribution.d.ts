import { Keypair } from '@solana/web3.js';
export interface FeeDistribution {
    buybackAmount: number;
    creatorAmount: number;
    lotteryAmount: number;
}
export declare function calculateFees(totalAmount: number): FeeDistribution;
export declare function distributeCreatorFee(userWallet: Keypair, amount: number): Promise<string | null>;
export declare function checkWalletBalance(walletAddress: string): Promise<number>;
//# sourceMappingURL=feeDistribution.d.ts.map