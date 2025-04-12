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
    VisuallyHidden,
} from "@mantine/core";

import { type PlayerInfo } from "@/api/client";

import {
    useVoteForm,
    VoteFormProvider,
    VoteFormType,
} from "@/components/vote/forms/vote-form-context";

import { Dispatch, SetStateAction } from "react";

import { zCastVote } from "@/api/client/zod.gen";

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
        validate: zodResolver(voteSchema),
    });

    const handleSubmit = (data: VoteFormType) => {
        // Replace this with the actual submit logic
        console.log("Submitting form data:", data);
    };

    return (
        <VoteFormProvider form={form}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <VisuallyHidden>
                    <Stack>
                        {form.getValues().votes.map((_, index) => (
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
                        ))}
                    </Stack>
                </VisuallyHidden>

                <Button type="submit" color="red">
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
            key={application.id}
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
