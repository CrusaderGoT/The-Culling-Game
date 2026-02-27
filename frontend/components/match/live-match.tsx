"use client";

import {
    Button,
    Center,
    Flex,
    Image as MantineImage,
    Paper,
    Skeleton,
    Stack,
} from "@mantine/core";

import { MatchHeader } from "@/components/match/match-header";
import { MatchPlayers } from "@/components/match/match-players";
import { MatchVoteChart } from "@/components/match/match-vote-chart";
import { VoteDrawer } from "@/components/vote/vote-drawer";

import { DisplayAPIError } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useSocketEventStable } from "@/lib/contexts/socket-context-provider";
import { useAssignMatchWinner } from "@/lib/hooks/admins/match";
import { useLatestMatch } from "@/lib/hooks/matches";
import { useGetMatchPlayers } from "@/lib/hooks/players";
import gstyles from "@/styles/global.module.css";
import clsx from "clsx";
import dayjs from "dayjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function LiveMatch({ ongoing = false }: { ongoing: boolean }) {
    const { token } = useAuth();

    const router = useRouter();

    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isEnded, setIsEnded] = useState<boolean>(false);

    const {
        data: latestMatch,
        isPending: matchIsPending,
        error: matchError,
    } = useLatestMatch(token, ongoing);

    const [match, setMatch] = useState(latestMatch);

    // Efffect for updating match state to lastest match when available
    useEffect(() => {
        if (!latestMatch) return;

        setMatch(latestMatch);
    }, [latestMatch]);

    // Extract player IDs from match data safely
    const playerIds = match?.players?.map((player) => player.id) || [];

    const {
        data: players,
        isPending: playersIsPending,
        error: playersError,
        refetchFailed,
    } = useGetMatchPlayers(token, playerIds);

    const validPlayers = useMemo(() => {
        return players?.filter((player) => player !== undefined) || [];
    }, [players]);

    // Vote Socket Events, for updating match votes
    useSocketEventStable("vote_casted", (data) => {
        if (match) {
            setMatch({
                ...match,
                votes: data,
            });
        }
    });

    const { mutateAsync } = useAssignMatchWinner(token);

    // effect for making match winner
    useEffect(() => {
        if (!token || !match || !isEnded || match.winner || match.draw) return;

        async function assignMatchWinner(matchId: number) {
            const wonMatch = await mutateAsync({ path: { match_id: matchId } });

            if (wonMatch) setMatch(wonMatch);
        }

        assignMatchWinner(match.id);
    }, [match, isEnded, mutateAsync, match?.winner, match?.draw, token]);

    // Match countdown timer
    useEffect(() => {
        if (!match) return;

        const updateTimer = () => {
            const now = dayjs();
            const endTime = dayjs(match.end);

            if (now.isAfter(endTime) || now.isSame(endTime)) {
                setIsEnded(true);
                setTimeLeft(`ended ${endTime.fromNow()}`);
                return;
            }

            const diff = endTime.diff(now);
            const duration = dayjs.duration(diff);

            const days = Math.floor(duration.asDays());
            const hours = duration.hours();
            const minutes = duration.minutes();
            const seconds = duration.seconds();

            let timeString = "";

            if (days > 0) {
                timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else if (hours > 0) {
                timeString = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                timeString = `${minutes}m ${seconds}s`;
            } else {
                timeString = `${seconds}s`;
            }

            setTimeLeft(timeString);
        };

        // Initial update
        updateTimer();

        // Set up interval to update every second
        const interval = setInterval(updateTimer, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [match]);

    if (matchIsPending || playersIsPending) {
        return (
            <Stack>
                <Skeleton h={40} radius={"md"} />

                <Flex
                    justify="space-between"
                    gap={"xs"}
                    direction={{ base: "column", md: "row" }}
                >
                    <Skeleton h={330} />

                    <Center
                        // on small screens, give vertical margin; on md+, remove vertical margin
                        my={{ base: "sm", md: 0 }}
                        // on md+, give horizontal margin to push icon away from players
                        mx={{ base: 0, md: "sm" }}
                    >
                        <Skeleton height={28} circle />
                    </Center>

                    <Skeleton h={330} />
                </Flex>
            </Stack>
        );
    }

    if (matchError || !match) {
        return (
            <Stack>
                <DisplayAPIError
                    error={
                        matchError
                            ? matchError
                            : new Error(
                                  "An error occured while loading match players"
                              )
                    }
                />

                <Button maw={200} mx={"auto"} onClick={() => router.refresh()}>
                    Refresh
                </Button>

                <MantineImage
                    src="/images/errors/4xx_arcade.jpeg"
                    fallbackSrc="/images/errors/4xx_arcade.svg"
                    alt="No Match"
                    component={Image}
                    height={1024}
                    width={1024}
                    flex={1}
                    mx={"auto"}
                />
            </Stack>
        );
    }

    return (
        <Stack>
            <Stack>
                <Paper
                    withBorder
                    p={"xs"}
                    style={{
                        backgroundColor: "Background",
                    }}
                    radius={"md"}
                    className={clsx(gstyles.matchHeader)}
                >
                    <MatchHeader
                        match={match}
                        isEnded={isEnded}
                        timeLeft={timeLeft}
                    />
                </Paper>

                <MatchPlayers
                    players={validPlayers}
                    match={match}
                    ended={isEnded}
                />
            </Stack>

            {match.votes.length > 0 && (
                <MatchVoteChart players={validPlayers} votes={match.votes} />
            )}

            {!playersIsPending && !isEnded && (
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
