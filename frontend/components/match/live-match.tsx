"use client";

import { Center, Paper, Skeleton, Stack } from "@mantine/core";

import { MatchPlayers } from "@/components/match/match-players";
import { MatchStatusHeader } from "@/components/match/match-status-header";
import { MatchVoteChart } from "@/components/match/match-vote-chart";
import { VoteDrawer } from "@/components/vote/vote-drawer";

import { useAuth } from "@/lib/auth/auth-provider";
import { useLatestMatch } from "@/lib/hooks/match";
import { useGetPlayers } from "@/lib/hooks/players";
import { useMemo } from "react";
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
        isFetched: playersIsFetched,
    } = useGetPlayers(token, playerIds);

    const validPlayers = useMemo(() => {
        if (players && playersIsFetched) {
            const vp = players.filter((player) => player !== undefined);
            return vp;
        }
    }, [players, playersIsFetched]);

    if (matchIsPending || (!validPlayers && playerIds.length > 0)) {
        return <Skeleton h={500} />;
    }

    if (matchError) {
        return (
            <Stack>
                <DisplayAPIError error={matchError} />
                <Skeleton h={500} />;
            </Stack>
        );
    }

    return (
        <Stack my={"md"}>
            <Paper withBorder p={"md"}>
                <Stack>
                    <MatchStatusHeader match={match} />

                    {validPlayers ? (
                        <MatchPlayers players={validPlayers} />
                    ) : (
                        <Stack>
                            {Array.from({ length: 2 }).map((_, index) => (
                                <Skeleton key={index} />
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Paper>

            <MatchVoteChart />

            {!playersIsPending && validPlayers && (
                <Center>
                    <VoteDrawer
                        players={validPlayers}
                        errors={playersError}
                        refetchFailed={refetchFailed}
                        matchId={match.id}
                    />
                </Center>
            )}
        </Stack>
    );
}
