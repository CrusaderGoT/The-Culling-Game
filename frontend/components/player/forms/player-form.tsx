"use client";

import { CreatePlayerForm } from "@/components/player/forms/create-player-form";
import { EditPlayerForm } from "@/components/player/forms/edit-player-form";
import { DisplayAPIError } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCurrentPlayer } from "@/lib/hooks/players";
import { Skeleton, Stack } from "@mantine/core";

export function PlayerForm() {
    const token = useAuth();
    const player = useCurrentPlayer(token);

    // Show loading while token is being loaded or query is pending
    if (!token || player.isPending) {
        return <Skeleton width={"100%"} height={400} mx={"auto"} />;
    }

    // Handle query errors
    if (player.isError) {
        console.error("Error fetching player:", JSON.stringify(player.error));

        // You might want to show an error component or fallback to create form
        return (
            <Stack>
                <DisplayAPIError error={player.error} />
                <CreatePlayerForm />
            </Stack>
        );
    }

    // Now we can safely check the data
    if (!player.data) {
        return <CreatePlayerForm />;
    } else {
        return <EditPlayerForm />;
    }
}
