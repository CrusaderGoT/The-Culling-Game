"use client"
import { AuthContext } from "@/lib/auth/auth-provider";
import { useCurrentPlayer } from "@/lib/hooks/users";
import { useContext } from "react";
import { CreatePlayerForm } from "./create-player-form";
import { EditPlayerForm } from "./edit-player-form";

export function PlayerForm() {
    const token = useContext(AuthContext);

    const player = useCurrentPlayer(token);

    if (player.isPending) {
        return <div>Loading</div>;
    }

    if (!player.data) {
        return <CreatePlayerForm />;
    }

    if (player.data) {
        return <EditPlayerForm />;
    }
}
