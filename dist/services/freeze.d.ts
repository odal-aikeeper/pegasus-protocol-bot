export interface FreezeStatus {
    frozen: boolean;
    account?: string;
    error?: string;
    authority?: string | null;
}
/**
 * Freeze dev wallet by removing token account authority
 * This makes it IMPOSSIBLE for the wallet to transfer tokens
 * WARNING: This is IRREVERSIBLE!
 */
export declare function freezeDevWallet(walletPrivateKey: string, tokenAccountAddress: string): Promise<string>;
/**
 * Check if a token account is frozen
 */
export declare function checkFreezeStatus(tokenAccountAddress: string): Promise<FreezeStatus>;
/**
 * Verify freeze on-chain (double-check)
 */
export declare function verifyFreeze(tokenAccountAddress: string): Promise<boolean>;
//# sourceMappingURL=freeze.d.ts.map