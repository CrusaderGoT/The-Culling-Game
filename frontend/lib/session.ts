// lib/auth/session.ts
"use server";

import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { Auth, Token } from "@/apis/client";
import { tokenNames } from "@/lib/constants/AUTHCONSTANTS";
import { cache } from "react";

export async function createSession(token: Token, res?: NextResponse) {
    const tokenExpiresAt = new Date(Date.now() + token.expires_in);

    const refreshTokenExpiresAt = new Date(
        Date.now() + token.refresh_expires_in
    );

    if (res) {
        // Route Handler mode: mutate the outgoing response
        res.cookies.set(tokenNames.access, token.access_token, {
            httpOnly: true,
            secure: true,
            expires: tokenExpiresAt,
            sameSite: "lax",
            path: "/",
        });

        res.cookies.set(tokenNames.refresh, token.refresh_token, {
            httpOnly: true,
            secure: true,
            expires: refreshTokenExpiresAt,
            sameSite: "lax",
            path: "/",
        });
    } else {
        // Server Action mode: use cookies() directly to send Set‑Cookie headers :contentReference[oaicite:0]{index=0}
        const cookieStore = await cookies();
        cookieStore.set({
            name: tokenNames.access,
            value: token.access_token,
            httpOnly: true,
            secure: true,
            expires: tokenExpiresAt,
            sameSite: "lax",
            path: "/",
        });
        cookieStore.set({
            name: tokenNames.refresh,
            value: token.refresh_token,
            httpOnly: true,
            secure: true,
            expires: refreshTokenExpiresAt,
            sameSite: "lax",
            path: "/",
        });
    }
}

export async function deleteSession(res?: NextResponse) {
    if (res) {
        res.cookies.delete(tokenNames.access);
        res.cookies.delete(tokenNames.refresh);
    } else {
        const cookieStore = await cookies();
        cookieStore.delete(tokenNames.access);
        cookieStore.delete(tokenNames.refresh); // deletes by sending Set-Cookie with maxAge=0 :contentReference[oaicite:1]{index=1}
    }
}
export const verifySession = cache(async (path: string = "/match") => {
    const token = (await cookies()).get(tokenNames.access)?.value;
    if (!token) {
        return null;
    }

    const { data } = await Auth.verifyToken({
        body: { token: token },
    });

    if (!data) {
        return null;
    }

    return token;
});

export const getClientCookie = async (name: string) => {
    const token = (await cookies()).get(name)?.value;
    return token;
};
