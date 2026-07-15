export function shouldBypassImageOptimization(src?: string | null): boolean {
    if (!src) return false;
    return /^https?:\/\//i.test(src);
}
