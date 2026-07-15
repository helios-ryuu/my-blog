import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const PROTECTED_PAGE_PATTERNS = [
    /^\/profile(\/|$)/,
    /^\/admin(\/|$)/,
    /^\/contest-management(\/|$)/,
];

const ADMIN_PAGE_PATTERNS = [/^\/admin(\/|$)/, /^\/contest-management(\/|$)/];

const PROTECTED_API_PATTERNS = [
    /^\/api\/auth\/me$/,
    /^\/api\/users\/me(\/|$)/,
    /^\/api\/submissions(\/|$)/,
];

const ADMIN_API_PATTERNS = [/^\/api\/admin(\/|$)/];

function matchesAny(pathname: string, patterns: RegExp[]) {
    return patterns.some((r) => r.test(pathname));
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isProtectedPage = matchesAny(pathname, PROTECTED_PAGE_PATTERNS);
    const isAdminPage = matchesAny(pathname, ADMIN_PAGE_PATTERNS);
    const isProtectedApi = matchesAny(pathname, PROTECTED_API_PATTERNS);
    const isAdminApi = matchesAny(pathname, ADMIN_API_PATTERNS);

    if (!isProtectedPage && !isProtectedApi && !isAdminPage && !isAdminApi) {
        return NextResponse.next();
    }

    const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

    if (!session) {
        if (isProtectedApi || isAdminApi) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/auth", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if ((isAdminPage || isAdminApi) && session.role !== "admin") {
        if (isAdminApi) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/profile/:path*",
        "/admin/:path*",
        "/contest-management/:path*",
        "/api/auth/me",
        "/api/users/me/:path*",
        "/api/admin/:path*",
        "/api/submissions/:path*",
    ],
};
