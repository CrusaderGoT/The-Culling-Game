import { CastVote } from "@/api/client";
import { createFormContext } from "@mantine/form";

export type VoteFormType = {
    votes: CastVote[];
    matchId: number;
};

export const [VoteFormProvider, useVoteFormContext, useVoteForm] =
    createFormContext<VoteFormType>();
