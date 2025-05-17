import { AuthService } from "@/api/client";
import { tokenNames } from "@/constants/tokenNames";
import { createSession, deleteSession } from "@/lib/auth/session";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
    const refreshToken = req.cookies.get(tokenNames.refresh)?.value;

    const nextPath = req.nextUrl.searchParams.get("next");

    if (!refreshToken) {
        await deleteSession(res);
        const loginUrl = new URL("/login", req.nextUrl);
        loginUrl.searchParams.set("next", nextPath ? nextPath : "/match");
        return NextResponse.redirect(loginUrl);
    }

    const { data } = await AuthService.refreshToken({
        body: { refresh_token: refreshToken },
    });

    if (!data) {
        await deleteSession(res);
        const loginUrl = new URL("/login", req.nextUrl);
        loginUrl.searchParams.set("next", nextPath ? nextPath : "/match");
        return NextResponse.redirect(loginUrl);
    }

    const okNext = new URL(nextPath ? nextPath : "/match", req.nextUrl);
    const okRes = NextResponse.redirect(okNext);
    createSession(data, okRes);
    return okRes;
}
