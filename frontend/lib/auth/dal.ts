import "server-only";

import { AuthService, PlayersService, UsersService } from "@/api/client";
import { updateSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const verifySession = cache(async () => {
    const cookieStore = await cookies();

    const token = cookieStore.get("session")?.value;

    if (!token) {
        const newToken = await updateSession();
        return newToken.access_token;
    }

    const { data } = await AuthService.verifyToken({
        body: { token: token },
    });

    if (!data) {
        const newToken = await updateSession();
        return newToken.access_token;
    }

    return token;
});

export const sessionUser = cache(async (redirected: boolean = false) => {
    const tokenData = await verifySession();

    // get current user
    const { data } = await UsersService.currentUser({
        headers: { Authorization: `Bearer ${tokenData}` },
    });

    // if auth error and should redirect
    // else if no redirect return null
    if (!data && redirected) {
        redirect("/signup");
    } else if (!data) {
        return null;
    }

    return data;
});

export const sessionPlayer = cache(async (redirected: boolean = false) => {
    const token = await verifySession();

    // get current user

    const { data } = await PlayersService.myPlayer({
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!data && redirected) {
        redirect("/create-player");
    } else if (!data) {
        return null;
    }

    return data;
});
