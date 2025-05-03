"use client";

import { Box, Button, Stack, TextInput } from "@mantine/core";

import {
    useVoteForm,
    VoteFormProvider,
    VoteFormType,
} from "@/components/vote/forms/vote-form-context";

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

                <Button type="submit" color="red">
                    Confirm
                </Button>
            </form>
        </VoteFormProvider>
    );
}
