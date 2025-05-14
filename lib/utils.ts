export function cleanString(input: string): string {
    return input.replace(/\//g, "").replace(/-/g, " ");
}
