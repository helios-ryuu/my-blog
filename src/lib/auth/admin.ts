import type { User } from "@/types/user";

export type AdminCredentialVerification = "valid" | "invalid_credentials" | "misconfigured";

function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let difference = 0;
    for (let index = 0; index < a.length; index += 1) {
        difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
    }
    return difference === 0;
}

async function sha256(value: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getAdminUser(username = process.env.ADMIN_USERNAME): User {
    return {
        username: username?.trim() || "admin",
        displayName: process.env.ADMIN_DISPLAY_NAME?.trim() || "Helios",
        role: "admin",
    };
}

export async function verifyAdminCredentials(username: string, password: string): Promise<AdminCredentialVerification> {
    const expectedUsername = process.env.ADMIN_USERNAME?.trim();
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim().toLowerCase();
    const hasPassword = Boolean(expectedPassword);
    const hasPasswordHash = Boolean(expectedPasswordHash);

    if (!expectedUsername || hasPassword === hasPasswordHash) return "misconfigured";
    if (expectedPasswordHash && !/^[a-f0-9]{64}$/.test(expectedPasswordHash)) return "misconfigured";

    const [usernameHash, expectedUsernameHash, passwordHash] = await Promise.all([
        sha256(username),
        sha256(expectedUsername),
        sha256(password),
    ]);
    const passwordMatches = expectedPasswordHash
        ? safeEqual(passwordHash, expectedPasswordHash)
        : safeEqual(passwordHash, await sha256(expectedPassword as string));

    return safeEqual(usernameHash, expectedUsernameHash) && passwordMatches
        ? "valid"
        : "invalid_credentials";
}
