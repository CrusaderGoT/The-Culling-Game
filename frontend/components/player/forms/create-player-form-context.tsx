import { createFormContext } from "@mantine/form";

import { z } from "zod";

import { zCreateCt, zCreateCtApp, zCreatePlayer } from "@/api/client/zod.gen";

import { GENDERS } from "@/lib/constants/GENDERS";

import { randomId } from "@mantine/hooks";

import {
    Group,
    List,
    NumberInput,
    Paper,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput
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
                <Stack key={randomId()}>
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

export function PlayerInfoList() {
    const player = useCreatePlayerFormContext().getValues().player;
    return (
        <List>
            <Text>Player Info</Text>
            <List withPadding listStyleType="disc" spacing={"xs"}>
                <List.Item>Name: {player.name}</List.Item>
                <List.Item>Age: {player.age}</List.Item>
                <List.Item>Gender: {player.gender}</List.Item>
                <List.Item>Role: {player.role}</List.Item>
            </List>
        </List>
    );
}

export function CTInfoList() {
    const cursed_technique =
        useCreatePlayerFormContext().getValues().cursed_technique;
    return (
        <List>
            Cursed Technique
            <List withPadding>
                <List.Item>Name: {cursed_technique.name}</List.Item>
                <List.Item>Definition: {cursed_technique.definition}</List.Item>
            </List>
        </List>
    );
}

export function CTAPPInfoList() {
    const applications = useCreatePlayerFormContext().getValues().applications;
    const appList = applications.map((app, index) => {
        return (
            <List withPadding key={randomId()}>
                Application {index + 1}
                <List withPadding>
                    <List.Item>Name: {app.name}</List.Item>
                    <List.Item>Application: {app.application}</List.Item>
                </List>
            </List>
        );
    });

    return (
        <Stack>
            <Text ta={"center"}>Cursed Technique Applications</Text>
            <List>
                <Group>{appList}</Group>
            </List>
        </Stack>
    );
}
