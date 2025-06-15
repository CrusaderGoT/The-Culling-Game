"use client";

import { MatchInfo, PlayerInfo } from "@/api/client";
import { SingleVoteGroup } from "@/components/vote/single-votes";
import { getColorFromId } from "@/lib/utils";
import classes from "@/styles/player-card.module.css";
import {
    AspectRatio,
    Badge,
    Divider,
    Group,
    Image as MantineImage,
    Paper,
    Stack,
    Text,
} from "@mantine/core";
import {
    IconMatchstick,
    IconPointFilled,
    IconSpiral,
} from "@tabler/icons-react";
import clsx from "clsx";
import Image from "next/image";
import { useMemo } from "react";
import { MatchActivateBarriers } from "../barrier/activate-barriers";

export function PlayerCard({
    player,
    match,
    ended = false,
}: {
    player: PlayerInfo;
    match?: MatchInfo;
    ended?: boolean;
}) {
    const playerMatchPoints = useMemo(() => {
        let points = 0;
        match?.votes.forEach((vote) => {
            if (vote.player_id === player.id) {
                points += vote.point;
            }
        });
        return points;
    }, [match?.votes, player.id]);

    return (
        <Paper withBorder p={"xs"} className={clsx(classes.fullHeight)}>
            <Stack className={clsx(classes.fullHeight, classes.spaceBetween)}>
                <Group p={5} justify="space-between">
                    <Badge
                        size="xs"
                        leftSection={<IconPointFilled size={14} />}
                        rightSection={
                            <Text size={"8"} visibleFrom="sm">
                                {player.points > 0 ? "Points" : "Point"}
                            </Text>
                        }
                        color={getColorFromId(player.points)}
                    >
                        {player.points}
                    </Badge>

                    <Badge
                        size="xs"
                        rightSection={
                            <Text size={"8"} visibleFrom="sm">
                                {player.matches.length > 1
                                    ? "Battles"
                                    : "Battle"}
                            </Text>
                        }
                        leftSection={<IconMatchstick size={14} />}
                        color={getColorFromId(player.matches.length)}
                    >
                        {player.matches.length}
                    </Badge>

                    {match && (
                        <Badge
                            size="xs"
                            rightSection={
                                <Text size={"8"} visibleFrom="sm">
                                    {playerMatchPoints > 0
                                        ? "Battle Points"
                                        : "Battle Point"}
                                </Text>
                            }
                            leftSection={<IconSpiral size={14} />}
                            color={getColorFromId(match.id)}
                        >
                            {playerMatchPoints}
                        </Badge>
                    )}
                </Group>

                <Group align="flex-start">
                    <AspectRatio
                        ratio={100 / 100}
                        className={clsx(classes.mAuto)}
                    >
                        <MantineImage
                            component={Image}
                            src={player.picture}
                            fallbackSrc="/images/Kogane.png"
                            alt="Player Image"
                            height={100}
                            width={100}
                            className={clsx(classes.playerImage)}
                        />
                    </AspectRatio>

                    <Group lts={4} flex={1} wrap="nowrap">
                        <Stack>
                            <Text size="xs">Name</Text>
                            <Text size="xs">Age</Text>
                            <Text size="xs">Gender</Text>
                            {player.role && <Text size="xs">Role</Text>}
                            <Text size="xs">Grade</Text>
                        </Stack>

                        <Divider orientation="vertical" />

                        <Stack flex={1} align="flex-end">
                            <Text size="xs" truncate maw={200}>
                                {player.name}
                            </Text>
                            <Text size="xs" truncate maw={200}>
                                {player.age}
                            </Text>
                            <Text size="xs" truncate maw={200}>
                                {player.gender}
                            </Text>
                            {player.role && (
                                <Text size="xs" truncate maw={200}>
                                    {player.role}
                                </Text>
                            )}
                            <Text size="xs" truncate maw={200}>
                                {player.grade < 1 ? "SPECIAL" : player.grade}
                            </Text>
                        </Stack>
                    </Group>
                </Group>

                {match && (
                    <Stack>
                        <Divider label="cursed techniques" />

                        <Group grow>
                            <SingleVoteGroup
                                applications={
                                    player.cursed_technique.applications
                                }
                                playerId={player.id}
                                match={match}
                                ended={ended}
                            />
                        </Group>
                    </Stack>
                )}

                {match && player.barrier_technique && (
                    <Stack>
                        <Divider label="Barrier techniques" />

                        <Group grow>
                            <MatchActivateBarriers
                                barrierTech={player.barrier_technique}
                                match={match}
                                ended={ended}
                            />
                        </Group>
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}
