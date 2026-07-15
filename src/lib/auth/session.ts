import type { UserRoleDb } from "@/types/database";

export const SESSION_COOKIE = "tmh_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
    userId: string;
    role: UserRoleDb;
    exp: number;
}

function getSecret(): string {
    return (
        process.env.SESSION_SECRET ||
        process.env.SUPABASE_SECRET_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "tmh-dev-session-secret"
    );
}

function base64UrlEncode(input: string): string {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(input).toString("base64url");
    }
    return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeBytes(input: Uint8Array): string {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(input).toString("base64url");
    }
    const binary = Array.from(input).map((b) => String.fromCharCode(b)).join("");
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string): string {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(input, "base64url").toString("utf8");
    }
    const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
    return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

async function hmac(message: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(getSecret()),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
    return base64UrlEncodeBytes(new Uint8Array(signature));
}

function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

export function createSessionPayload(userId: string, role: UserRoleDb): SessionPayload {
    return {
        userId,
        role,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };
}

export async function signSession(payload: SessionPayload): Promise<string> {
    const encoded = base64UrlEncode(JSON.stringify(payload));
    return `${encoded}.${await hmac(encoded)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
    if (!token) return null;
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;
    const expected = await hmac(encoded);
    if (!safeEqual(signature, expected)) return null;
    try {
        const payload = JSON.parse(base64UrlDecode(encoded)) as SessionPayload;
        if (!payload.userId || !payload.role || !payload.exp) return null;
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}

export const sessionCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
};
