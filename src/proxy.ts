import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const ADMIN_PAGE_PATTERNS = [/^\/admin(\/|$)/];
const ADMIN_API_PATTERNS = [/^\/api\/admin(\/|$)/];

function matchesAny(pathname: string, patterns: RegExp[]) {
    return patterns.some((r) => r.test(pathname));
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAdminPage = matchesAny(pathname, ADMIN_PAGE_PATTERNS);
    const isAdminApi = matchesAny(pathname, ADMIN_API_PATTERNS);

    if (!isAdminPage && !isAdminApi) {
        return NextResponse.next();
    }

    const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

    if (!session) {
        if (isAdminApi) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/auth", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (session.role !== "admin") {
        if (isAdminApi) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/api/admin/:path*",
    ],
};
