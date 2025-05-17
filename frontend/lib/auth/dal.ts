import "server-only";

import { AuthService, PlayersService, UsersService } from "@/api/client";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { tokenNames } from "@/constants/tokenNames";

export const verifySession = cache(async (path: string = "/match") => {
    const token = (await cookies()).get(tokenNames.access)?.value;
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
    const { data } = await UsersService.currentUser({
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!data) {
        return null;
    }

    return data;
});

export const sessionPlayer = cache(async (path: string) => {
    const token = await verifySession(path);

    // get current user

    const { data } = await PlayersService.myPlayer({
        headers: { Authorization: `Bearer ${token}` },
    });
 
    if (!data) {
        return null;
    }

    return data;
});
