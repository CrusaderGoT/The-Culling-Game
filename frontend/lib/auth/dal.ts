import "server-only";

import { AuthService, PlayersService, UsersService } from "@/api/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const verifySession = cache(async (path: string = "/match") => {
    const token = (await cookies()).get("session")?.value;
    if (!token) {
        redirect(`/api/auth/refresh?next=${path}`);
    }

    const { data } = await AuthService.verifyToken({
        body: { token: token },
    });

    if (!data) {
        redirect(`/api/auth/refresh?next=${path}`);
    }

    return token;
});

export const sessionUser = cache(async (path: string) => {
    const token = await verifySession(path);

    // get current user
    const { data, error } = await UsersService.currentUser({
        headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
        const detail =
            typeof error === "object" && error !== null && "detail" in error
                ? (error as { detail?: string }).detail
                : undefined;
        throw new Error(detail ? detail : "Error Fetching User");
    }

    if (!data) {
        return null;
    }

    return data;
});

export const sessionPlayer = cache(async (path: string) => {
    const token = await verifySession(path);

    // get current user

    const { data, error } = await PlayersService.myPlayer({
        headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
        const detail =
            typeof error === "object" && error !== null && "detail" in error
                ? (error as { detail?: string }).detail
                : undefined;
        throw new Error(detail ? detail : "Error Fetching Player");
    }

    if (!data) {
        return null;
    }

    return data;
});
