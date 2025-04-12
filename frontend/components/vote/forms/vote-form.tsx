"use client";

import {
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    Group,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";

import { type PlayerInfo } from "@/api/client";

import {
    useVoteForm,
    VoteFormProvider,
    VoteFormType,
} from "@/components/vote/forms/vote-form-context";

import { Dispatch, SetStateAction } from "react";

import { zCastVote } from "@/api/client/zod.gen";

import { randomId } from "@mantine/hooks";

import { zodResolver } from "@mantine/form";

import { z } from "zod";

export function VoteForm({ votes }: VoteFormType) {
    const voteSchema = z.object({ votes: z.array(zCastVote) });

    const initialValues: VoteFormType = {
        votes: votes,
    };

    const form = useVoteForm({
        mode: "uncontrolled",
        initialValues,
        validate: zodResolver(voteSchema)
    });

    return (
        <VoteFormProvider form={form}>
            <form onSubmit={form.onSubmit((data) => console.log(data))}>
                <Stack>
                    {form.getValues().votes.map((_, index) => {
                        return (
                            <Box key={index}>
                                <TextInput
                                    key={form.key(`votes.${index}.player_id`)}
                                    {...form.getInputProps(
                                        `votes.${index}.player_id`
                                    )}
                                    disabled
                                />

                                <TextInput
                                    key={form.key(`votes.${index}.ct_app_id`)}
                                    {...form.getInputProps(
                                        `votes.${index}.ct_app_id`
                                    )}
                                    disabled
                                />
                            </Box>
                        );
                    })}
                </Stack>

                <Button
                    type="submit"
                    color="red"
                >
                    Confirm
                </Button>
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
