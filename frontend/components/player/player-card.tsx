import { MatchInfo, PlayerInfo } from "@/api/client";
import { SingleVoteGroup } from "@/components/vote/single-votes";
import { getColorFromId } from "@/lib/utils";
import {
    Badge,
    Divider,
    Group,
    Image as MantineImage,
    Paper,
    Stack,
    Text,
} from "@mantine/core";
import { IconGradienter, IconMatchstick, IconPoint } from "@tabler/icons-react";
import Image from "next/image";
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
    return (
        <Paper withBorder p={"xs"}>
            <Stack>
                <Group justify="space-between" p={5}>
                    <Badge
                        size="xs"
                        leftSection={<IconPoint size={14} />}
                        rightSection={
                            <Text size={"8"} visibleFrom="sm">
                                {player.points > 1 ? "Points" : "Point"}
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
                                    ? "Matches"
                                    : "Match"}
                            </Text>
                        }
                        leftSection={<IconMatchstick size={14} />}
                        color={getColorFromId(player.matches.length)}
                    >
                        {player.matches.length}
                    </Badge>

                    <Badge
                        size="xs"
                        leftSection={
                            <Text size={"8"} visibleFrom="sm">
                                Grade
                            </Text>
                        }
                        rightSection={<IconGradienter size={14} />}
                        color={getColorFromId(player.grade)}
                    >
                        {player.grade}
                    </Badge>
                </Group>

                <Group align="flex-start">
                    <MantineImage
                        component={Image}
                        src={"/images/Kogane.png"}
                        alt="Player Image"
                        height={100}
                        width={100}
                        w={"auto"}
                        h={"auto"}
                        mx={"auto"}
                    />

                    <Group lts={4} flex={1} wrap="nowrap">
                        <Stack>
                            <Text size="xs">Name</Text>
                            <Text size="xs">Age</Text>
                            <Text size="xs">Gender</Text>
                            {player.role && <Text size="xs">Role</Text>}
                        </Stack>

                        <Divider orientation="vertical" />

                        <Stack flex={1} align="flex-end">
                            <Text size="xs">{player.name}</Text>
                            <Text size="xs">{player.age}</Text>
                            <Text size="xs">{player.gender}</Text>
                            {player.role && (
                                <Text size="xs">{player.role}</Text>
                            )}
                        </Stack>
                    </Group>
                </Group>

                {match && (
                    <>
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
                    </>
                )}

                {player.barrier_technique && match && (
                    <>
                        <Divider label="Barrier techniques" />

                        <Group>
                            <MatchActivateBarriers
                                barrierTech={player.barrier_technique}
                                match={match}
                                ended={ended}
                            />
                        </Group>
                    </>
                )}
            </Stack>
        </Paper>
    );
}
