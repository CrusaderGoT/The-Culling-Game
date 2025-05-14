"use server";

import { AuthService, PlayersService, UsersService } from "@/api/client";
import { getSession, updateSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { cache } from "react";

export const verifyUpdateSession = cache(async () => {
    const cookieStore = await cookies();

    const token = cookieStore.get("session")?.value;

    if (!token) {
        const newToken = await updateSession();
        if (!newToken) return null;
        return newToken.access_token;
    }

    const { data } = await AuthService.verifyToken({
        body: { token: token },
    });

    if (!data) {
        const newToken = await updateSession();
        if (!newToken) return null;
        return newToken.access_token;
    }

    return token;
});

export const sessionUser = cache(async () => {
    const token = await getSession();

    // get current user
    const { data, error } = await UsersService.currentUser({
        headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
        throw new Error(error.detail ? error.detail : "Error Fetching Player");
    }

    if (!data) {
        return null;
    }

    return data;
});

export const sessionPlayer = cache(async () => {
    const token = await getSession();

    // get current user

    const { data, error } = await PlayersService.myPlayer({
        headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
        throw new Error(error.detail ? error.detail : "Error Fetching Player");
    }

    if (!data) {
        return null;
    }

    return data;
});
