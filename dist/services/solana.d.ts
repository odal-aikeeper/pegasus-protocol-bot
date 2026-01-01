import { Connection, Keypair } from '@solana/web3.js';
declare const connection: Connection;
declare let wallet: Keypair;
declare function initWallet(): Promise<void>;
export declare function getBalance(): Promise<number>;
export declare function getWalletAddress(): string;
export { connection, wallet, initWallet };
//# sourceMappingURL=solana.d.ts.map