"use server";

import { AuthService, Token } from "@/api/client";
import { redirect } from "next/navigation";

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

export async function updateSession() {
    const cookieStore = await cookies();

    const refresh_token = cookieStore.get("refresh_token")?.value;

    if (!refresh_token) {
        await deleteSession();
        return null;
    }

    const { data } = await AuthService.refreshToken({
        body: { refresh_token },
    });

    if (!data) {
        await deleteSession();
        return null;
    }

    await createSession(data);

    return data;
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    cookieStore.delete("refresh_token");
}

export async function getSession() {
    const token = (await cookies()).get("session")?.value;
    if (!token) {
        redirect(`/login`);
    }
    return token;
}
