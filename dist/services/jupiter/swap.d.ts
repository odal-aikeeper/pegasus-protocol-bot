import { Keypair } from '@solana/web3.js';
export declare function getSwapQuote(inputMint: string, outputMint: string, amount: number, slippageBps?: number): Promise<any>;
export declare function executeSwap(wallet: Keypair, inputMint: string, outputMint: string, amount: number, slippageBps?: number): Promise<string>;
export declare function getTokenPrice(tokenMint: string): Promise<number>;
//# sourceMappingURL=swap.d.ts.map