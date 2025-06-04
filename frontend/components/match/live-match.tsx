"use client";

import {
    Button,
    Center,
    Image as MantineImage,
    Paper,
    Skeleton,
    Stack,
} from "@mantine/core";

import { MatchPlayers } from "@/components/match/match-players";
import { MatchHeader } from "@/components/match/match-status-header";
import { MatchVoteChart } from "@/components/match/match-vote-chart";
import { VoteDrawer } from "@/components/vote/vote-drawer";

import { DisplayAPIError } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/auth/auth-provider";
import { useLatestMatch } from "@/lib/hooks/match";
import { useGetPlayers } from "@/lib/hooks/players";
import globalClasses from "@/styles/global.module.css";
import clsx from "clsx";
import dayjs from "dayjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export function LiveMatch() {
    const { token } = useAuth();

    const router = useRouter();

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

    if (matchIsPending || !validPlayers) {
        return <Skeleton h={"90vh"} my={"sm"} />;
    }

    if (matchError) {
        return (
            <Stack>
                <DisplayAPIError error={matchError} />

                <MantineImage
                    src="/images/errors/4xx_arcade.jpeg"
                    fallbackSrc="/images/errors/4xx_arcade.svg"
                    alt="No Match"
                    component={Image}
                    height={1024}
                    width={1024}
                    h={{ base: 512, md: 768, xl: 1024 }}
                    w={{ base: 512, md: 768, xl: 1024 }}
                    mx={"auto"}
                />

                <Button w={200} mx={"auto"} onClick={() => router.refresh()}>
                    Refresh
                </Button>
            </Stack>
        );
    }

    const now = dayjs();
    const endTime = dayjs(match.end);
    const ended = now.isAfter(endTime) || now.isSame(endTime);

    return (
        <Stack my={"md"}>
            <Stack>
                <Paper
                    withBorder
                    p={"xs"}
                    style={{
                        backgroundColor: "Background",
                    }}
                    radius={"md"}
                    className={clsx(globalClasses.matchHeader)}
                >
                    <MatchHeader match={match} />
                </Paper>

                <MatchPlayers
                    players={validPlayers}
                    match={match}
                    ended={ended}
                />
            </Stack>

            {match.votes.length > 0 && (
                <MatchVoteChart players={validPlayers} votes={match.votes} />
            )}

            {!playersIsPending && !ended && (
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
