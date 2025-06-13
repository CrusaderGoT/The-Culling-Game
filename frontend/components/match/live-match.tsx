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
import { useAuth } from "@/lib/contexts/auth-provider";
import { useLatestMatch } from "@/lib/hooks/match";
import { useGetPlayers } from "@/lib/hooks/players";
import globalClasses from "@/styles/global.module.css";
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
        data: match,
        isPending: matchIsPending,
        error: matchError,
    } = useLatestMatch(token, ongoing);

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

    // Extract player IDs from match data safely
    const playerIds = match?.players?.map((player) => player.id) || [];

    const {
        data: players,
        isPending: playersIsPending,
        error: playersError,
        refetchFailed,
    } = useGetPlayers(token, playerIds);

    const validPlayers = useMemo(() => {
        return players?.filter((player) => player !== undefined) || [];
    }, [players]);

    if (matchIsPending || playersIsPending) {
        return (
            <Stack>
                <Skeleton
                    h={40}
                    radius={"md"}
                    className={clsx(globalClasses.matchHeader)}
                />

                <Flex
                    justify="space-between"
                    gap={"xs"}
                    direction={{ base: "column", md: "row" }}
                >
                    <Skeleton h={330} />
                    <Skeleton h={330} />
                </Flex>
            </Stack>
        );
    }

    if (matchError || playersError) {
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
                    h={{ base: 512, md: 768 }}
                    w={{ base: 512, md: 768 }}
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
                    className={clsx(globalClasses.matchHeader)}
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
