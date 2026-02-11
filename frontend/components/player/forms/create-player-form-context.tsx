"use client";

import { createFormContext } from "@mantine/form";

import { GENDERS } from "@/lib/constants/GENDERS";

import { BodyCreatePlayer } from "@/apis/client";
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

export const [
    CreatePlayerFormProvider,
    useCreatePlayerFormContext,
    useCreatePlayerForm,
] = createFormContext<BodyCreatePlayer>();

export function PlayerFormInputs() {
    const form = useCreatePlayerFormContext();

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
        <Stack gap={"xl"} justify="space-evenly">
            {applicationsField}
        </Stack>
    );
}

export function PlayerInfoFormList() {
    const player = useCreatePlayerFormContext().getValues().player;
    return (
        <>
            <Title ff={`${Naluka.style.fontFamily}`} order={3} ta={"center"}>
                Player Info
            </Title>
            <List listStyleType="disc" spacing={"xs"}>
                <List.Item>
                    Picture: <Text>{player.picture}</Text>
                </List.Item>
                <List.Item>
                    Name: <Text>{player.name}</Text>
                </List.Item>
                <List.Item>
                    Age: <Text>{player.age}</Text>
                </List.Item>
                <List.Item>
                    Gender: <Text>{player.gender}</Text>
                </List.Item>
                <List.Item>
                    Role: <Text>{player.role}</Text>
                </List.Item>
            </List>
        </>
    );
}

export function CursedTechniqueFormList() {
    const cursed_technique =
        useCreatePlayerFormContext().getValues().cursed_technique;
    return (
        <>
            <Title ff={`${Naluka.style.fontFamily}`} order={3} ta={"center"}>
                Cursed Technique
            </Title>
            <List withPadding listStyleType="disc" spacing={"xs"}>
                <List.Item>
                    Name: <Text>{cursed_technique.name}</Text>
                </List.Item>
                <List.Item>
                    Definition:
                    <Text>{cursed_technique.definition}</Text>
                </List.Item>
            </List>
        </>
    );
}

export function ApplicationFormList() {
    const applications = useCreatePlayerFormContext().getValues().applications;
    const appList = applications.map((app, index) => {
        return (
            <>
                <Title order={6} key={index}>
                    Application {index + 1}
                </Title>

                <List key={index} listStyleType="disc" spacing={"xs"}>
                    <List.Item>
                        Name: <Text>{app.name}</Text>
                        Application:
                        <Text> {app.application}</Text>
                    </List.Item>
                </List>
            </>
        );
    });

    return (
        <Stack>
            <Title ff={`${Naluka.style.fontFamily}`} order={3} ta={"center"}>
                Applications
            </Title>
            <Group align="flex-start" justify="space-between">
                {appList}
            </Group>
        </Stack>
    );
}
