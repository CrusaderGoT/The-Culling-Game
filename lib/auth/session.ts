"use server";

import { cookies } from "next/headers";

export async function createSession(token: string) {
    const cookieStore = await cookies();

    // match token expire in fastapi
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    cookieStore.set("session", token, {
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: "lax",
        path: "/",
    });
}

export async function updateSession() {
    const token = (await cookies()).get("session")?.value;

    if (!token) return null;

    const updateExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // FASTAPI to actually update/refresh the token
    // use sdk here/ no tansstack
    // fail return null
    // else session = newSession

    const cookieStore = await cookies();

    cookieStore.set("session", token, {
        httpOnly: true,
        secure: true,
        expires: updateExpires,
        sameSite: "lax",
        path: "/",
    });
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
}
