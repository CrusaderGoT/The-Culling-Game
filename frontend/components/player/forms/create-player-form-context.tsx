import { createFormContext } from "@mantine/form";

import { z } from "zod";

import { zCreateCt, zCreateCtApp, zCreatePlayer } from "@/api/client/zod.gen";

import { GENDERS } from "@/lib/constants/GENDERS";

import {
    Group,
    NumberInput,
    Select,
    Stack,
    Textarea,
    TextInput,
} from "@mantine/core";

export const createPlayerSchema = z.object({
    player: zCreatePlayer,
    cursed_technique: zCreateCt,
    applications: z.array(zCreateCtApp).min(5).max(5),
});

export type CreatePlayerSchemaType = z.infer<typeof createPlayerSchema>;

export const [
    CreatePlayerFormProvider,
    useCreatePlayerFormContext,
    useCreatePlayerForm,
] = createFormContext<CreatePlayerSchemaType>();

export function PlayerInputs() {
    const form = useCreatePlayerFormContext();

    return (
        <Stack>
            <Stack>
                <TextInput
                    label="Player Name"
                    key={form.key("player.name")}
                    {...form.getInputProps("player.name")}
                    withAsterisk
                />

                <TextInput
                    label="Role"
                    key={form.key("player.role")}
                    {...form.getInputProps("player.role")}
                />
            </Stack>

            <Group grow>
                <NumberInput
                    min={10}
                    max={102}
                    clampBehavior="none"
                    allowNegative={false}
                    allowDecimal={false}
                    allowLeadingZeros={false}
                    label="Age"
                    key={form.key("player.age")}
                    {...form.getInputProps("player.age")}
                />

                <Select
                    data={GENDERS}
                    clearable
                    placeholder="select"
                    label="Gender"
                    key={form.key("player.gender")}
                    {...form.getInputProps("player.gender")}
                />
            </Group>
        </Stack>
    );
}

export function CursedTechniqueInputs() {
    const form = useCreatePlayerFormContext();

    return (
        <Stack>
            <TextInput
                label="Cursed Technique Name"
                key={form.key("cursed_technique.name")}
                {...form.getInputProps("cursed_technique.name")}
                withAsterisk
            />

            <Textarea
                label="Cursed Technique Name"
                key={form.key("cursed_technique.definition")}
                {...form.getInputProps("cursed_technique.definition")}
                withAsterisk
            />
        </Stack>
    );
}
