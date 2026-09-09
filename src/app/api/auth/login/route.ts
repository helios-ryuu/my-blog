import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { getAdminUser, verifyAdminCredentials } from "@/lib/auth/admin";
import { createSessionPayload, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIp, recordFailedAttempt, recordSuccessfulLogin } from "@/lib/auth/rate-limit";

export async function GET(req: NextRequest) {
    try {
        const clientIp = getClientIp(req);
        const status = await checkRateLimit(clientIp);
        return apiSuccess({
            ip: clientIp,
            isLocked: status.isLocked,
            lockedUntil: status.lockedUntil,
            remainingSeconds: status.remainingSeconds,
            attemptsRemaining: status.attemptsRemaining,
        });
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        const clientIp = getClientIp(req);

        // Pre-check rate limit status
        const rateLimitStatus = await checkRateLimit(clientIp);
        if (rateLimitStatus.isLocked) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Too many failed attempts. Access is temporarily locked.",
                    data: {
                        isLocked: true,
                        lockedUntil: rateLimitStatus.lockedUntil,
                        remainingSeconds: rateLimitStatus.remainingSeconds,
                        attemptsRemaining: 0,
                    },
                },
                { status: 429 }
            );
        }

        // Artificial 500ms delay to deter automated high-speed brute-force attacks
        await new Promise((resolve) => setTimeout(resolve, 500));

        const body = await req.json().catch(() => ({}));
        const username = typeof body.username === "string" ? body.username.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";
        if (!username || !password) return apiError("Username and password are required", 400);
        if (username.length > 200 || password.length > 1024) return apiError("Credentials are too long", 400);

        const verification = await verifyAdminCredentials(username, password);
        if (verification === "misconfigured") {
            console.error("Admin authentication is misconfigured: configure exactly one valid password source");
            return apiError("Authentication is temporarily unavailable", 503);
        }

        if (verification === "invalid_credentials") {
            const failStatus = await recordFailedAttempt(clientIp);
            if (failStatus.isLocked) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Too many failed attempts. Access is temporarily locked.",
                        data: {
                            isLocked: true,
                            lockedUntil: failStatus.lockedUntil,
                            remainingSeconds: failStatus.remainingSeconds,
                            attemptsRemaining: 0,
                        },
                    },
                    { status: 429 }
                );
            }

            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid username or password",
                    data: {
                        isLocked: false,
                        lockedUntil: null,
                        remainingSeconds: 0,
                        attemptsRemaining: failStatus.attemptsRemaining,
                        attemptsCount: failStatus.attemptsCount,
                    },
                },
                { status: 401 }
            );
        }

        // Login successful: reset failed attempt counter
        await recordSuccessfulLogin(clientIp);

        const user = getAdminUser(username);
        const token = await signSession(createSessionPayload(user.username));
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
        return apiSuccess(user);
    } catch (err) {
        return handleRouteError(err);
    }
}
