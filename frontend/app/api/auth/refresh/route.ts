import { AuthService } from "@/api/client";
import { createSession, deleteSession } from "@/lib/auth/session";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const refreshToken = req.cookies.get("refresh_token")?.value;

    const path = req.nextUrl.searchParams.get("next");

    if (!refreshToken) {
        await deleteSession();
        const loginUrl = new URL("/login", req.nextUrl);
        loginUrl.searchParams.set("next", path ? path : "/match");
        return NextResponse.redirect(loginUrl);
    }

    const { data } = await AuthService.refreshToken({
        body: { refresh_token: refreshToken },
    });

    if (!data) {
        await deleteSession();
        const loginUrl = new URL("/login", req.nextUrl);
        loginUrl.searchParams.set("next", path ? path : "/match");
        return NextResponse.redirect(loginUrl);
    }

    await createSession(data);

    const loginUrl = new URL(path ? path : "/match", req.nextUrl);
    return NextResponse.redirect(loginUrl);
}
