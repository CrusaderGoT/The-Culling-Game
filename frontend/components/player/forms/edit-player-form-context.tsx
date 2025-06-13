"use client";

import { createFormContext } from "@mantine/form";

import { z } from "zod";

import { zEditCt, zEditCtApp, zEditPlayer } from "@/api/client/zod.gen";
import { GENDERS } from "@/lib/constants/GENDERS";
import {
    Group,
    NumberInput,
    Paper,
    Select,
    Stack,
    Textarea,
    TextInput,
} from "@mantine/core";

export const editPlayerSchema = z.object({
    player: zEditPlayer,
    cursed_technique: zEditCt,
    applications: z.array(zEditCtApp).min(5).max(5),
});

export type EditPlayerSchemaType = z.infer<typeof editPlayerSchema>;

export const [
    EditPlayerFormProvider,
    useEditPlayerFormContext,
    useEditPlayerForm,
] = createFormContext<EditPlayerSchemaType>();

export function EditPlayerFormInputs() {
    const form = useEditPlayerFormContext();

    return (
        <Stack>
            <Stack>
                <TextInput
                    label="Player Picture"
                    key={form.key("player.picture")}
                    {...form.getInputProps("player.picture")}
                />

                <TextInput
                    label="Player Name"
                    key={form.key("player.name")}
                    {...form.getInputProps("player.name")}
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

export function EditCursedTechniqueFormInputs() {
    const form = useEditPlayerFormContext();

    return (
        <Stack>
            <TextInput
                label="Cursed Technique Name"
                key={form.key("cursed_technique.name")}
                {...form.getInputProps("cursed_technique.name")}
            />

            <Textarea
                label="Cursed Technique Definition"
                key={form.key("cursed_technique.definition")}
                {...form.getInputProps("cursed_technique.definition")}
                autosize
                minRows={5}
                maxRows={10}
            />
        </Stack>
    );
}

export function EditApplicationsFormInputs() {
    const form = useEditPlayerFormContext();

    const applicationsField = form.getValues().applications.map((_, index) => {
        return (
            <Paper key={index} withBorder p={"xs"}>
                <Stack key={index}>
                    <TextInput
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
                    />
                </Stack>
            </Paper>
        );
    });

    return (
        <Stack gap={"xl"} justify="space-evenly">
            {applicationsField}
        </Stack>
    );
}
