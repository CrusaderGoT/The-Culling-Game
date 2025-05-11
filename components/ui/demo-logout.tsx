"use client";
import { deleteSession } from "@/lib/auth/session";
import { Button } from "@mantine/core";
import { redirect } from "next/navigation";

export function LogOutBtn() {
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
