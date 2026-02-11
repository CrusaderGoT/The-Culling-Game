"use client";

import { Box, Button, Stack, TextInput } from "@mantine/core";

import {
    useVoteForm,
    VoteFormProvider,
    VoteFormType,
} from "@/components/vote/forms/vote-form-context";

import { zCastVote } from "@/apis/client/zod.gen";

import { zodResolver } from "mantine-form-zod-resolver";

import { z } from "zod";

import { DisplayAPIError } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useCastVote } from "@/lib/hooks/matches";

export function VoteForm({ votes, matchId }: VoteFormType) {
    const voteSchema = z.object({
        votes: z.array(zCastVote),
    });

    const initialValues: VoteFormType = {
        votes: votes,
        matchId: matchId,
    };

    const form = useVoteForm({
        mode: "uncontrolled",
        initialValues,
        validate: zodResolver(voteSchema),
    });

    const { token } = useAuth();

    const { mutate, isPending, isError, error } = useCastVote(token);

    const handleSubmit = (data: VoteFormType) => {
        mutate({
            path: { match_id: data.matchId },
            body: data.votes,
        });
    };

    return (
        <VoteFormProvider form={form}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    {isError && error && !isPending && (
                        <DisplayAPIError error={error} />
                    )}

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

                <Button type="submit" color="red" disabled={isPending}>
                    Confirm
                </Button>
            </form>
        </VoteFormProvider>
    );
}
