import { createFormContext } from "@mantine/form";

import { z } from "zod";

import { zCreateCt, zCreateCtApp, zCreatePlayer } from "@/api/client/zod.gen";

import { GENDERS } from "@/lib/constants/GENDERS";

import { randomId } from "@mantine/hooks";

import {
    Group,
    NumberInput,
    Paper,
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
                    withAsterisk
                />

                <Select
                    data={GENDERS}
                    clearable
                    placeholder="select"
                    label="Gender"
                    key={form.key("player.gender")}
                    {...form.getInputProps("player.gender")}
                    withAsterisk
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
                label="Cursed Technique Definition"
                key={form.key("cursed_technique.definition")}
                {...form.getInputProps("cursed_technique.definition")}
                autosize
                minRows={5}
                maxRows={10}
                withAsterisk
            />
        </Stack>
    );
}

export function ApplicationsInputs() {
    const form = useCreatePlayerFormContext();

    const applicationsField = form.getValues().applications.map((_, index) => {
        return (
            <Paper key={randomId()} withBorder p={"xs"}>
                <Stack>
                    <TextInput
                        withAsterisk
                        label={`Application ${index + 1} - Name`}
                        key={form.key(`applications.${index}.name`)}
                        {...form.getInputProps(`applications.${index}.name`)}
                    />

                    <Textarea
                        label={`Application ${index + 1} - Description`}
                        key={form.key(`applications.${index}.application`)}
                        {...form.getInputProps(
                            `applications.${index}.application`
                        )}
                        autosize
                        minRows={7}
                        maxRows={15}
                        withAsterisk
                    />
                </Stack>
            </Paper>
        );
    });

    return (
        <Group
            preventGrowOverflow={false}
            gap={"xl"}
            grow
            justify="space-evenly"
        >
            {applicationsField}
        </Group>
    );
}
