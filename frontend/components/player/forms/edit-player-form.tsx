"use client";

import { PlayerInfo } from "@/api/client";
import {
    EditApplicationsFormInputs,
    EditCursedTechniqueFormInputs,
    EditPlayerFormInputs,
    EditPlayerFormProvider,
    EditPlayerSchemaType,
    editPlayerSchema,
    useEditPlayerForm,
} from "@/components/player/forms/edit-player-form-context";
import { DisplayAPIError } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-provider";
import { useEditPlayer } from "@/lib/hooks/players";
import { Button, Group, Stack } from "@mantine/core";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

export function EditPlayerForm({ player }: { player: PlayerInfo }) {
    const { token } = useAuth();

    const [disabled, setDisabled] = useState(true);

    const initialValues: EditPlayerSchemaType = {
        player: {
            name: player.name,
            gender: player.gender,
            age: player.age,
            role: player.role,
        },
        cursed_technique: {
            ...player.cursed_technique,
        },
        applications: [...player.cursed_technique.applications],
    };

    const form = useEditPlayerForm({
        initialValues: initialValues,
        mode: "uncontrolled",
        validate: zodResolver(editPlayerSchema),
        enhanceGetInputProps: () => ({ disabled }),
    });

    const { error, mutateAsync } = useEditPlayer(token);

    async function handleSubmit(data: EditPlayerSchemaType) {
        await mutateAsync({
            path: { player_id: player.id },
            body: { ...data },
        });
    }

    return (
        <EditPlayerFormProvider form={form}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    {error && <DisplayAPIError error={error} />}

                    <EditPlayerFormInputs />
                    <EditCursedTechniqueFormInputs />
                    <EditApplicationsFormInputs />

                    <Group>
                        <Button onClick={() => setDisabled((d) => !d)}>
                            {!disabled ? "Cancel" : "Edit"}
                        </Button>
                        {!disabled && (
                            <Button type="submit">save changes</Button>
                        )}
                    </Group>
                </Stack>
            </form>
        </EditPlayerFormProvider>
    );
}
