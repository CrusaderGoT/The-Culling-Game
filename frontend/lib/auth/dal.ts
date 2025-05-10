import "server-only";

import { PlayersService, UsersService } from "@/api/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const verifySession = cache(async () => {
    const token = (await cookies()).get("session")?.value;

    if (!token) {
        redirect("/login");
    }
    // check if token has expired

    return token;
});

export const sessionUser = cache(async (redirected: boolean = false) => {
    const token = await verifySession();

    // get current user
    const { data } = await UsersService.currentUser({
        headers: { Authorization: `Bearer ${token}` },
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
