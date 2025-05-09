import { CreatePlayerForm } from "@/components/player/forms/create-player-form";

import { sessionPlayer } from "@/lib/auth/dal";

import { redirect } from "next/navigation";

export default async function CreatePlayerPage() {
    const player = await sessionPlayer(true);

    if (player) redirect("/edit-player");

    return <CreatePlayerForm />;
}
