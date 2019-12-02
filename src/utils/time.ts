export function delay(ms: number): Promise<unknown> {
    // Create a promise with specific duration.
    return new Promise(resolve => setTimeout(resolve, ms));
}