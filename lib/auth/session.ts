"use server";

import { Token } from "@/api/client";

import { cookies } from "next/headers";

export async function createSession(token: Token) {
    const cookieStore = await cookies();

    const tokenExpiresAt = new Date(Date.now() + token.expires_in);

    const refreshTokenExpiresAt = new Date(
        Date.now() + token.refresh_expires_in
    );

    cookieStore.set("session", token.access_token, {
        httpOnly: true,
        secure: true,
        expires: tokenExpiresAt,
        sameSite: "lax",
        path: "/",
    });

    cookieStore.set("refresh_token", token.refresh_token, {
        httpOnly: true,
        secure: true,
        expires: refreshTokenExpiresAt,
        sameSite: "lax",
        path: "/",
    });
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    cookieStore.delete("refresh_token");
}
