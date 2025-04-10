"use client";

import {
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    Group,
    Stack,
    Text,
} from "@mantine/core";

import { type PlayerInfo } from "@/api/client";

import {
    useVoteForm,
    VoteFormProvider,
    VoteFormType,
} from "@/components/match/forms/vote-form-context";

import { Dispatch, SetStateAction } from "react";

import { randomId } from "@mantine/hooks";

export function VoteForm({ votes }: VoteFormType) {
    const initialValues: VoteFormType = {
        votes: [],
    };

    const form = useVoteForm({
        mode: "uncontrolled",
        initialValues,
    });

    return (
        <VoteFormProvider form={form}>
            <form onSubmit={form.onSubmit((data) => console.log(data))}>
                <Button type="submit">submit</Button>
            </form>
        </VoteFormProvider>
    );
}

type VoteCardProp = {
    player: PlayerInfo;
    value: string[];
    setValue: Dispatch<SetStateAction<string[]>>;
};

export function VoteCards({ player, value, setValue }: VoteCardProp) {
    const cards = player.cursed_technique.applications.map((application) => (
        <Checkbox.Card
            key={randomId()}
            radius={"md"}
            value={`${JSON.stringify({
                ct_app_id: application.id,
                player_id: player.id,
            })}`}
        >
            <Group>
                <Checkbox.Indicator />
                <Stack>
                    <Text>{application.name}</Text>
                    <Text>{application.application}</Text>
                </Stack>
            </Group>
        </Checkbox.Card>
    ));

    return (
        <Box>
            <CheckboxGroup value={value} onChange={setValue}>
                <Stack gap={"xs"}>{cards}</Stack>
            </CheckboxGroup>
        </Box>
    );
}
