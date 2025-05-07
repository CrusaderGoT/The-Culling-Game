import { createFormContext } from "@mantine/form";

import { z } from "zod";

import { zCreateCt, zCreateCtApp, zCreatePlayer } from "@/api/client/zod.gen";

import { GENDERS } from "@/lib/constants/GENDERS";

import { randomId } from "@mantine/hooks";

import Naluka from "@/fonts/NalukaFont";
import {
    Group,
    List,
    NumberInput,
    Paper,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
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

export function PlayerFormInputs() {
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

export function CursedTechniqueFormInputs() {
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

export function ApplicationsFormInputs() {
    const form = useCreatePlayerFormContext();

    const applicationsField = form.getValues().applications.map((_, index) => {
        return (
            <Paper key={index} withBorder p={"xs"}>
                <Stack key={index}>
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

export function PlayerInfoFormList() {
    const player = useCreatePlayerFormContext().getValues().player;
    return (
        <List>
            <Title ff={`${Naluka.style.fontFamily}`} order={3} ta={"center"}>
                Player Info
            </Title>
            <List withPadding listStyleType="disc" spacing={"xs"}>
                <List.Item>
                    Name: <Text c={"orange"}>{player.name}</Text>
                </List.Item>
                <List.Item>
                    Age: <Text c={"blue"}>{player.age}</Text>
                </List.Item>
                <List.Item>
                    Gender: <Text c={"green"}>{player.gender}</Text>
                </List.Item>
                <List.Item>
                    Role: <Text c={"red"}>{player.role}</Text>
                </List.Item>
            </List>
        </List>
    );
}

export function CursedTechniqueFormList() {
    const cursed_technique =
        useCreatePlayerFormContext().getValues().cursed_technique;
    return (
        <List>
            <Title ff={`${Naluka.style.fontFamily}`} order={3} ta={"center"}>
                Cursed Technique
            </Title>
            <List withPadding listStyleType="disc" spacing={"xs"}>
                <List.Item>
                    Name: <Text c={"lime"}>{cursed_technique.name}</Text>
                </List.Item>
                <List.Item>
                    Definition:{" "}
                    <Text c={"deepred"}>{cursed_technique.definition}</Text>
                </List.Item>
            </List>
        </List>
    );
}

export function ApplicationFormList() {
    const applications = useCreatePlayerFormContext().getValues().applications;
    const appList = applications.map((app, index) => {
        return (
            <List key={randomId()}>
                <Title order={6}>Application {index + 1}</Title>

                <List withPadding listStyleType="disc" spacing={"xs"}>
                    <List.Item>
                        Name: <Text c={"lime"}>{app.name}</Text>
                    </List.Item>
                    <List.Item>
                        Application: <Text c={"cyan"}> {app.application}</Text>
                    </List.Item>
                </List>
            </List>
        );
    });

    return (
        <Stack>
            <Title ff={`${Naluka.style.fontFamily}`} order={3} ta={"center"}>
                Applications
            </Title>
            <List spacing={"xs"}>
                <Group align="flex-start" justify="space-between">
                    {appList}
                </Group>
            </List>
        </Stack>
    );
}
