import { NextRequest } from "next/server";
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

export function getClientIp(req: NextRequest): string {
    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();

    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        const first = forwardedFor.split(",")[0]?.trim();
        if (first) return first;
    }

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    return "127.0.0.1";
}

export async function checkRateLimit(ip: string): Promise<RateLimitStatus> {
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

export async function recordFailedAttempt(ip: string): Promise<RateLimitStatus> {
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

    // Save to Supabase
    try {
        const supabase = createSupabaseAdminClient();
        await supabase
            .from("auth_rate_limits")
            .upsert({
                ip,
                attempt_count: newCount,
                escalation_level: newEscalation,
                locked_until: lockedUntilIso,
                last_attempt_at: new Date(now).toISOString(),
                updated_at: new Date(now).toISOString(),
            });
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

export async function recordSuccessfulLogin(ip: string): Promise<void> {
    // Clear in-memory
    memoryStore.delete(ip);

    // Clear Supabase record
    try {
        const supabase = createSupabaseAdminClient();
        await supabase
            .from("auth_rate_limits")
            .delete()
            .eq("ip", ip);
    } catch (err) {
        console.warn("[RateLimit] Supabase delete on success failed:", err);
    }
}

export async function unblockIp(ip: string): Promise<boolean> {
    memoryStore.delete(ip);

    try {
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase
            .from("auth_rate_limits")
            .delete()
            .eq("ip", ip);
        if (error) throw error;
        return true;
    } catch (err) {
        console.warn("[RateLimit] Supabase unblock failed:", err);
        return true; // memory was cleared
    }
}

export async function listBlockedIps(): Promise<BlockedIpEntry[]> {
    const nowIso = new Date().toISOString();
    try {
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase
            .from("auth_rate_limits")
            .select("ip, attempt_count, escalation_level, locked_until, last_attempt_at, updated_at")
            .or(`locked_until.gt.${nowIso},attempt_count.gt.0`)
            .order("updated_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        return (data || []).map((row) => ({
            ip: row.ip,
            attemptsCount: row.attempt_count,
            escalationLevel: row.escalation_level,
            lockedUntil: row.locked_until,
            lastAttemptAt: row.last_attempt_at,
            updatedAt: row.updated_at,
        }));
    } catch (err) {
        console.warn("[RateLimit] Supabase listBlockedIps failed, returning memory records:", err);
        const entries: BlockedIpEntry[] = [];
        memoryStore.forEach((val, key) => {
            if ((val.lockedUntil && val.lockedUntil > Date.now()) || val.attemptCount > 0) {
                entries.push({
                    ip: key,
                    attemptsCount: val.attemptCount,
                    escalationLevel: val.escalationLevel,
                    lockedUntil: val.lockedUntil ? new Date(val.lockedUntil).toISOString() : null,
                    lastAttemptAt: new Date(val.lastAttemptAt).toISOString(),
                    updatedAt: new Date(val.updatedAt).toISOString(),
                });
            }
        });
        return entries;
    }
}
