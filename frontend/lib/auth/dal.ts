import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { useCurrentUser } from "../hooks/users";

export const verifySession = cache(async () => {
    const session = (await cookies()).get("session")?.value;

    if (!session) {
        redirect("/login");
    }
    // check if session has expired

    // return relevant info
    return session;
});

export const sessionUser = cache(async () => {
    const session = await verifySession();
    // get current user
    const { data } = useCurrentUser(session);

    // if auth error, redirect("/login")
    if (!data) redirect("/login");
});
