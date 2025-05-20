import { AuthService } from "@/api/client";
import { tokenNames } from "@/lib/constants/AUTHCONSTANTS";
import { createSession, deleteSession } from "@/lib/auth/session";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const refreshToken = req.cookies.get(tokenNames.refresh)?.value;

    const nextPath = req.nextUrl.searchParams.get("next");

    if (!refreshToken) {
        const loginUrl = new URL("/login", req.nextUrl);
        loginUrl.searchParams.set("next", nextPath ? nextPath : "/match");
        const res = NextResponse.redirect(loginUrl);
        await deleteSession(res);
        return res;
    }

    const { data } = await AuthService.refreshToken({
        body: { refresh_token: refreshToken },
    });

    if (!data) {
        const loginUrl = new URL("/login", req.nextUrl);
        loginUrl.searchParams.set("next", nextPath ? nextPath : "/match");
        const res = NextResponse.redirect(loginUrl);
        await deleteSession(res);
        return res;
    }

    const okNext = new URL(nextPath ? nextPath : "/match", req.nextUrl);
    const okRes = NextResponse.redirect(okNext);
    createSession(data, okRes);
    return okRes;
}
