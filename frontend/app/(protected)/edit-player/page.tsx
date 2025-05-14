import { LogOutBtn } from "@/components/ui/demo-logout";

import { sessionPlayer } from "@/lib/auth/dal";

import { Text } from "@mantine/core";

import { redirect } from "next/navigation";

export default async function EditPlayerPage() {
    const player = await sessionPlayer("/edit-player");

    if (!player) {
        redirect("/create-player");
    } else {
        return (
            <>
                <Text>
                    Edit player goes here: {JSON.stringify(player, null, 4)}
                </Text>
                <LogOutBtn />;
            </>
        );
    }
}
