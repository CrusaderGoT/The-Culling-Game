"use server";

import { AuthService, Token } from "@/api/client";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

export async function updateSession() {
    const cookieStore = await cookies();

    const refresh_token = cookieStore.get("refresh_token")?.value;

    if (!refresh_token) redirect("/login");

    const { data } = await AuthService.refreshToken({
        body: { refresh_token },
    });

    if (!data) redirect("/login");

    await createSession(data);

    return data;
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    cookieStore.delete("refresh_token");
}
