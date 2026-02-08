import { tokenNames } from "@/lib/constants/AUTHCONSTANTS";
import { NextRequest, NextResponse } from "next/server";

// 1. Specify protected and public routes
const protectedRoutes = ["/match", "/create-player", "/edit-player"];
const publicRoutes = ["/login", "/signup", "/"];

/**
 * for performing optimistic checks.
 * it's a good way to centralize redirect logic and pre-filter unauthorized users.
 * protect static routes that share data between users (e.g. content behind a paywall).
 */
export default async function proxy(req: NextRequest) {
    // 2. Check if the current route is protected or public
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.includes(path);
    const isPublicRoute = publicRoutes.includes(path);

    // 3. check that refresh token exists in session
    const session = req.cookies.has(tokenNames.refresh);

    // 4. Redirect to /login if the user is not authenticated
    if (isProtectedRoute && !session) {
        const loginUrl = new URL("/login", req.nextUrl);
        loginUrl.searchParams.set("next", path);
        return NextResponse.redirect(loginUrl);
    }

    // 5. Redirect to /match if the user is authenticated
    if (
        isPublicRoute &&
        session &&
        !req.nextUrl.pathname.startsWith("/match")
    ) {
        const nextUrl = req.nextUrl.searchParams.get("next");

        const redirectUrl = nextUrl ? nextUrl : "/match";
        return NextResponse.redirect(new URL(redirectUrl, req.nextUrl));
    }

    return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
