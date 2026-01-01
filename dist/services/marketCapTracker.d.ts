/**
 * Fetch current market cap from token supply and price
 */
export declare function updateMarketCap(): Promise<number>;
/**
 * Format market cap for display
 */
export declare function formatMarketCap(mc: number): string;
/**
 * Create progress bar for display
 */
export declare function createProgressBar(percentage: number): string;
/**
 * Start market cap tracking - updates every 5 minutes
 */
export declare function startMarketCapTracking(): void;
//# sourceMappingURL=marketCapTracker.d.ts.map