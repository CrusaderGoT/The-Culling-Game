"use client";

import { Card, CardSection } from "@mantine/core";

import { MatchPlayers } from "@/components/match/match-players";
import { MatchStatusHeader } from "@/components/match/match-status-header";
import { MatchVoteChart } from "@/components/match/match-vote-chart";
import { VoteDrawer } from "@/components/vote/vote-drawer";

import { useAuth } from "@/lib/auth/auth-provider";
import { useLatestMatch } from "@/lib/hooks/match";
import { useGetPlayers } from "@/lib/hooks/players";
import { DisplayAPIError } from "../ui/display-api-error";

export function LiveMatch() {
    const token = useAuth();

    const {
        data: match,
        isPending: matchIsPending,
        error: matchError,
    } = useLatestMatch(token);

    // Extract player IDs from match data safely
    const playerIds = match?.players?.map((player) => player.id) || [];

    const {
        data: players,
        isPending: playersIsPending,
        error: playersError,
        refetchFailed,
    } = useGetPlayers(token, playerIds);

    if (matchIsPending) {
        return <div>Loading</div>;
    }

    if (matchError) {
        return <DisplayAPIError error={matchError} />;
    }

    return (
        <Card padding={"xs"}>
            <CardSection p={"xs"}>
                <MatchStatusHeader match={match} />
            </CardSection>

            <MatchPlayers />

            <CardSection p={"xs"} pr={"xl"}>
                <MatchVoteChart />
            </CardSection>

            <CardSection mx={"auto"} p={"xs"}>
                {!playersIsPending && (
                    <VoteDrawer
                        players={players}
                        errors={playersError}
                        refetchFailed={refetchFailed}
                    />
                )}
            </CardSection>
        </Card>
    );
}
