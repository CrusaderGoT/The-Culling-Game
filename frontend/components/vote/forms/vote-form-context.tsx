import { type CastVote } from "@/api/client";
import { createFormContext } from "@mantine/form";

export type VoteFormType = {
    votes: CastVote[];
};

export const [VoteFormProvider, useVoteFormContext, useVoteForm] =
    createFormContext<VoteFormType>();
