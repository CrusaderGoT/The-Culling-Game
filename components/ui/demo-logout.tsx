"use client";

import { deleteSession } from "@/lib/session";
import { Button } from "@mantine/core";
import { redirect } from "next/navigation";

export function LogOutButton() {
    return (
        <Button
            onClick={async () => {
                await deleteSession();
                redirect("/");
            }}
        >
            logout
        </Button>
    );
}
