import { MatchInfo, PlayerInfo } from "@/api/client";
import { getColorFromId } from "@/lib/utils";
import {
    ActionIcon,
    Badge,
    Box,
    Center,
    Divider,
    Flex,
    Group,
    Image as MantineImage,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    Tooltip,
} from "@mantine/core";

import Image from "next/image";

import { useAuth } from "@/lib/auth/auth-provider";
import { useCastVote } from "@/lib/hooks/match";
import {
    Icon,
    IconCactus,
    IconGradienter,
    IconHierarchy,
    IconMatchstick,
    IconPoint,
    IconStretching,
    IconSunElectricity,
    IconVectorBezier,
    IconVolcano,
    IconVs,
} from "@tabler/icons-react";
import { Fragment } from "react";

type MatchPlayersProp = {
    players: PlayerInfo[];
    match: MatchInfo;
    ended: boolean;
};
export function MatchPlayers({ players, match, ended }: MatchPlayersProp) {
    return (
        <Flex
            justify="space-between"
            gap={"xs"}
            direction={{ base: "column", md: "row" }}
        >
            {players.map((player, index) => {
                return (
                    <Fragment key={index}>
                        <Box flex={1}>
                            <PlayerPaper
                                player={player}
                                match={match}
                                ended={ended}
                            />
                        </Box>

                        {index + 1 < players.length && (
                            <Center
                                // on small screens, give vertical margin; on md+, remove vertical margin
                                my={{ base: "sm", md: 0 }}
                                // on md+, give horizontal margin to push icon away from players
                                mx={{ base: 0, md: "sm" }}
                            >
                                <ThemeIcon
                                    color="red"
                                    size="lg"
                                    variant="light"
                                    radius="lg"
                                    // this ensures it centers itself along the main axis of the Flex
                                    style={{ alignSelf: "center" }}
                                >
                                    <IconVs size={18} />
                                </ThemeIcon>
                            </Center>
                        )}
                    </Fragment>
                );
            })}
        </Flex>
    );
}

function PlayerPaper({
    player,
    match,
    ended,
}: {
    player: PlayerInfo;
    match: MatchInfo;
    ended: boolean;
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

                <Divider />

                <Group grow>
                    <SingleVoteGroup
                        applications={player.cursed_technique.applications}
                        playerId={player.id}
                        match={match}
                        ended={ended}
                    />
                </Group>

                <Group>Barrier techniques</Group>
            </Stack>
        </Paper>
    );
}

type SingleVoteGroupProp = {
    applications: PlayerInfo["cursed_technique"]["applications"];
    match: MatchInfo;
    playerId: number;
    ended: boolean;
};
function SingleVoteGroup({
    applications,
    match,
    playerId,
    ended,
}: SingleVoteGroupProp) {
    const appIcons = [
        IconCactus,
        IconVectorBezier,
        IconVolcano,
        IconSunElectricity,
        IconHierarchy,
    ];

    const appGroup = applications.map((app, index) => {
        const prevVotes = match.votes.filter(
            (vote) => vote.ct_app_id === app.id
        ).length;

        const icon = appIcons[index];

        return (
            <SingleVote
                key={index}
                match={match}
                application={app}
                playerId={playerId}
                prevVotes={prevVotes}
                icon={icon}
                ended={ended}
            />
        );
    });

    return <ActionIcon.Group>{appGroup}</ActionIcon.Group>;
}

type SingleVoteProp = {
    match: MatchInfo;
    application: PlayerInfo["cursed_technique"]["applications"][0];
    playerId: number;
    prevVotes: number;
    icon?: Icon;
    ended: boolean;
};
function SingleVote({
    match,
    application,
    playerId,
    prevVotes,
    icon = IconStretching,
    ended,
}: SingleVoteProp) {
    const { token } = useAuth();

    const { mutateAsync, isPending, reset } = useCastVote(token);

    const AppIcon = icon;

    return (
        <>
            <ActionIcon
                variant="subtle"
                size="xs"
                flex={1}
                onClick={async () => {
                    try {
                        await mutateAsync({
                            path: { match_id: match.id },
                            body: [
                                {
                                    player_id: playerId,
                                    ct_app_id: application.id,
                                },
                            ],
                        });
                    } catch (e) {
                        reset();
                    }
                }}
                loading={isPending}
                color={getColorFromId(playerId)}
                disabled={ended}
            >
                <Tooltip label={`vote for ${application.name}`}>
                    <AppIcon />
                </Tooltip>
            </ActionIcon>

            <ActionIcon.GroupSection
                variant="light"
                size="xs"
                flex={1}
                color={getColorFromId(playerId)}
            >
                <Tooltip label={`${application.name} has ${prevVotes} vote(s)`}>
                    <Text size="xs">{prevVotes}</Text>
                </Tooltip>
            </ActionIcon.GroupSection>
        </>
    );
}
