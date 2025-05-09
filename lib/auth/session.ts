import "server-only";

import { cookies } from "next/headers";

export async function createSession(token: string) {
    const cookieStore = await cookies();

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
    const session = (await cookies()).get("session")?.value;

    if (!session) return null;

    const updateExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // FASTAPI to actually update/refresh the token
    // mutaute async refresh token
    // fail return null
    // else session = newSession

    const cookieStore = await cookies();

    cookieStore.set("session", session, {
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
