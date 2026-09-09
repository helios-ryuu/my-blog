import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface RateLimitStatus {
    isLocked: boolean;
    lockedUntil: string | null;
    remainingSeconds: number;
    attemptsCount: number;
    attemptsRemaining: number;
    escalationLevel: number;
}

export interface BlockedIpEntry {
    ip: string;
    attemptsCount: number;
    escalationLevel: number;
    lockedUntil: string | null;
    lastAttemptAt: string;
    updatedAt: string;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_1_MS = 15 * 60 * 1000; // 15 minutes lockout for level 1
const LOCKOUT_2_MS = 60 * 60 * 1000; // 60 minutes lockout for level 2

// In-memory fallback if Supabase is temporarily unreachable or table not yet created
interface MemoryRecord {
    attemptCount: number;
    escalationLevel: number;
    lockedUntil: number | null;
    lastAttemptAt: number;
    updatedAt: number;
}

const memoryStore = new Map<string, MemoryRecord>();

function getMemoryRecord(ip: string): MemoryRecord {
    let rec = memoryStore.get(ip);
    if (!rec) {
        rec = {
            attemptCount: 0,
            escalationLevel: 0,
            lockedUntil: null,
            lastAttemptAt: Date.now(),
            updatedAt: Date.now(),
        };
        memoryStore.set(ip, rec);
    }
    return rec;
}

export function normalizeIp(raw: string): string {
    let ip = (raw || "").trim();
    if (ip.startsWith("[") && ip.includes("]")) {
        ip = ip.replace(/^\[([^\]]+)\].*$/, "$1");
    } else if (ip.includes(":") && ip.includes(".") && ip.indexOf(":") === ip.lastIndexOf(":")) {
        ip = ip.split(":")[0];
    }
    if (ip.startsWith("::ffff:")) {
        ip = ip.substring(7);
    }
    if (ip === "::1" || ip === "localhost") {
        ip = "127.0.0.1";
    }
    return ip;
}

export function getClientIp(req: NextRequest): string {
    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return normalizeIp(cfIp);

    const xRealIp = req.headers.get("x-real-ip");
    if (xRealIp) return normalizeIp(xRealIp);

    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        const first = forwardedFor.split(",")[0]?.trim();
        if (first) return normalizeIp(first);
    }

    const trueClientIp = req.headers.get("true-client-ip");
    if (trueClientIp) return normalizeIp(trueClientIp);

    const xClientIp = req.headers.get("x-client-ip");
    if (xClientIp) return normalizeIp(xClientIp);

    const forwarded = req.headers.get("forwarded");
    if (forwarded) {
        const match = forwarded.match(/for="?([^";,]+)/i);
        if (match && match[1]) return normalizeIp(match[1]);
    }

    const reqIp = (req as unknown as { ip?: string }).ip;
    if (reqIp) return normalizeIp(reqIp);

    return "127.0.0.1";
}

export async function checkRateLimit(rawIp: string): Promise<RateLimitStatus> {
    const ip = normalizeIp(rawIp);
    const now = Date.now();
    try {
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase
            .from("auth_rate_limits")
            .select("ip, attempt_count, escalation_level, locked_until, last_attempt_at, updated_at")
            .eq("ip", ip)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return {
                isLocked: false,
                lockedUntil: null,
                remainingSeconds: 0,
                attemptsCount: 0,
                attemptsRemaining: MAX_ATTEMPTS,
                escalationLevel: 0,
            };
        }

        const lockedUntilTime = data.locked_until ? new Date(data.locked_until).getTime() : null;
        const lastAttemptTime = new Date(data.last_attempt_at).getTime();

        // Check if currently locked
        if (lockedUntilTime && lockedUntilTime > now) {
            const remainingSeconds = Math.ceil((lockedUntilTime - now) / 1000);
            return {
                isLocked: true,
                lockedUntil: data.locked_until,
                remainingSeconds,
                attemptsCount: data.attempt_count,
                attemptsRemaining: 0,
                escalationLevel: data.escalation_level,
            };
        }

        // If lockout expired or window passed without lockout, reset attempts
        if (now - lastAttemptTime > WINDOW_MS && (!lockedUntilTime || lockedUntilTime <= now)) {
            return {
                isLocked: false,
                lockedUntil: null,
                remainingSeconds: 0,
                attemptsCount: 0,
                attemptsRemaining: MAX_ATTEMPTS,
                escalationLevel: data.escalation_level,
            };
        }

        const remaining = Math.max(0, MAX_ATTEMPTS - data.attempt_count);
        return {
            isLocked: false,
            lockedUntil: null,
            remainingSeconds: 0,
            attemptsCount: data.attempt_count,
            attemptsRemaining: remaining,
            escalationLevel: data.escalation_level,
        };
    } catch (err) {
        console.warn("[RateLimit] Supabase query failed, using in-memory store:", err);
        const rec = getMemoryRecord(ip);
        if (rec.lockedUntil && rec.lockedUntil > now) {
            const remainingSeconds = Math.ceil((rec.lockedUntil - now) / 1000);
            return {
                isLocked: true,
                lockedUntil: new Date(rec.lockedUntil).toISOString(),
                remainingSeconds,
                attemptsCount: rec.attemptCount,
                attemptsRemaining: 0,
                escalationLevel: rec.escalationLevel,
            };
        }
        if (now - rec.lastAttemptAt > WINDOW_MS && (!rec.lockedUntil || rec.lockedUntil <= now)) {
            rec.attemptCount = 0;
            rec.lockedUntil = null;
        }
        const remaining = Math.max(0, MAX_ATTEMPTS - rec.attemptCount);
        return {
            isLocked: false,
            lockedUntil: null,
            remainingSeconds: 0,
            attemptsCount: rec.attemptCount,
            attemptsRemaining: remaining,
            escalationLevel: rec.escalationLevel,
        };
    }
}

export async function recordFailedAttempt(rawIp: string): Promise<RateLimitStatus> {
    const ip = normalizeIp(rawIp);
    const current = await checkRateLimit(ip);
    const now = Date.now();
    const newCount = current.attemptsCount + 1;
    let lockedUntilIso: string | null = null;
    let remainingSeconds = 0;
    let isLocked = false;
    let newEscalation = current.escalationLevel;

    if (newCount >= MAX_ATTEMPTS) {
        isLocked = true;
        if (current.escalationLevel >= 1) {
            // Escalated lockout: 60 minutes
            const unlockTime = now + LOCKOUT_2_MS;
            lockedUntilIso = new Date(unlockTime).toISOString();
            remainingSeconds = Math.ceil(LOCKOUT_2_MS / 1000);
            newEscalation = 2;
        } else {
            // First lockout: 15 minutes
            const unlockTime = now + LOCKOUT_1_MS;
            lockedUntilIso = new Date(unlockTime).toISOString();
            remainingSeconds = Math.ceil(LOCKOUT_1_MS / 1000);
            newEscalation = 1;
        }
    }

    const attemptsRemaining = isLocked ? 0 : Math.max(0, MAX_ATTEMPTS - newCount);

    // Save to in-memory store first
    const mem = getMemoryRecord(ip);
    mem.attemptCount = newCount;
    mem.escalationLevel = newEscalation;
    mem.lockedUntil = lockedUntilIso ? new Date(lockedUntilIso).getTime() : null;
    mem.lastAttemptAt = now;
    mem.updatedAt = now;

    // Also update rawIp in memory if different
    if (rawIp && rawIp !== ip) {
        const rawMem = getMemoryRecord(rawIp);
        rawMem.attemptCount = newCount;
        rawMem.escalationLevel = newEscalation;
        rawMem.lockedUntil = mem.lockedUntil;
        rawMem.lastAttemptAt = now;
        rawMem.updatedAt = now;
    }

    // Save to Supabase
    try {
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase
            .from("auth_rate_limits")
            .upsert({
                ip,
                attempt_count: newCount,
                escalation_level: newEscalation,
                locked_until: lockedUntilIso,
                last_attempt_at: new Date(now).toISOString(),
                updated_at: new Date(now).toISOString(),
            });
        if (error) {
            console.error("[RateLimit] Supabase upsert error:", error);
        }
    } catch (err) {
        console.warn("[RateLimit] Supabase upsert failed:", err);
    }

    return {
        isLocked,
        lockedUntil: lockedUntilIso,
        remainingSeconds,
        attemptsCount: newCount,
        attemptsRemaining,
        escalationLevel: newEscalation,
    };
}

export async function recordSuccessfulLogin(rawIp: string): Promise<void> {
    const ip = normalizeIp(rawIp);
    // Clear in-memory
    memoryStore.delete(ip);
    if (rawIp && rawIp !== ip) memoryStore.delete(rawIp);

    // Clear Supabase record
    try {
        const supabase = createSupabaseAdminClient();
        await supabase
            .from("auth_rate_limits")
            .delete()
            .or(`ip.eq.${ip},ip.eq.${rawIp}`);
    } catch (err) {
        console.warn("[RateLimit] Supabase delete on success failed:", err);
    }
}

export async function unblockIp(rawIp: string): Promise<boolean> {
    const ip = normalizeIp(rawIp);
    memoryStore.delete(ip);
    if (rawIp && rawIp !== ip) memoryStore.delete(rawIp);

    try {
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase
            .from("auth_rate_limits")
            .delete()
            .or(`ip.eq.${ip},ip.eq.${rawIp}`);
        if (error) throw error;
        return true;
    } catch (err) {
        console.warn("[RateLimit] Supabase unblock failed:", err);
        return true; // memory was cleared
    }
}

export async function listBlockedIps(): Promise<BlockedIpEntry[]> {
    const now = Date.now();
    const map = new Map<string, BlockedIpEntry>();

    // 1. First collect all in-memory records
    memoryStore.forEach((val, key) => {
        const normIp = normalizeIp(key);
        const isLocked = val.lockedUntil !== null && val.lockedUntil > now;
        if (isLocked || val.attemptCount > 0) {
            map.set(normIp, {
                ip: normIp,
                attemptsCount: val.attemptCount,
                escalationLevel: val.escalationLevel,
                lockedUntil: val.lockedUntil ? new Date(val.lockedUntil).toISOString() : null,
                lastAttemptAt: new Date(val.lastAttemptAt).toISOString(),
                updatedAt: new Date(val.updatedAt).toISOString(),
            });
        }
    });

    // 2. Fetch from Supabase and merge
    try {
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase
            .from("auth_rate_limits")
            .select("ip, attempt_count, escalation_level, locked_until, last_attempt_at, updated_at")
            .order("updated_at", { ascending: false })
            .limit(100);

        if (!error && data) {
            for (const row of data) {
                const normIp = normalizeIp(row.ip);
                const lockedUntilTime = row.locked_until ? new Date(row.locked_until).getTime() : 0;
                const isLocked = lockedUntilTime > now;
                if (isLocked || row.attempt_count > 0) {
                    const existing = map.get(normIp);
                    if (!existing || new Date(row.updated_at).getTime() > new Date(existing.updatedAt).getTime()) {
                        map.set(normIp, {
                            ip: normIp,
                            attemptsCount: Math.max(row.attempt_count, existing?.attemptsCount || 0),
                            escalationLevel: Math.max(row.escalation_level, existing?.escalationLevel || 0),
                            lockedUntil: row.locked_until || existing?.lockedUntil || null,
                            lastAttemptAt: row.last_attempt_at || existing?.lastAttemptAt || new Date(now).toISOString(),
                            updatedAt: row.updated_at || existing?.updatedAt || new Date(now).toISOString(),
                        });
                    }
                }
            }
        } else if (error) {
            console.error("[RateLimit] Supabase select error in listBlockedIps:", error);
        }
    } catch (err) {
        console.warn("[RateLimit] Supabase query exception in listBlockedIps:", err);
    }

    return Array.from(map.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}
