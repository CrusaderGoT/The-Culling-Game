"use client";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCurrentPlayer } from "@/lib/hooks/players";
import { Skeleton } from "@mantine/core";
import { CreatePlayerForm } from "@/components/player/forms/create-player-form";
import { EditPlayerForm } from "@/components/player/forms/edit-player-form";

export function PlayerForm() {
    const token = useAuth();

    const player = useCurrentPlayer(token);

    if (player.isPending) {
        return <Skeleton width={"100%"} height={400} mx={"auto"} />;
    }

    if (!player.data) {
        return <CreatePlayerForm />;
    } else {
        return <EditPlayerForm />;
    }
}
