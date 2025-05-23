import { PlayerInfo } from "@/api/client";
import {
    Avatar,
    Badge,
    Box,
    Center,
    Flex,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";

import { IconArrowUp, IconChartArcs, IconVs } from "@tabler/icons-react";
import { Fragment } from "react";

type MatchPlayersProp = {
    players: PlayerInfo[];
};
export function MatchPlayers({ players }: MatchPlayersProp) {
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
                            <PlayerPaper player={player} />
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

function PlayerPaper({ player }: { player: PlayerInfo }) {
    return (
        <Paper withBorder p={"xs"}>
            <Group justify="space-between" p={5}>
                <Badge
                    size="xs"
                    leftSection={<IconChartArcs size={14} />}
                    rightSection={<IconArrowUp size={14} />}
                >
                    {player.points}
                </Badge>
            </Group>
            <Stack p={"md"} align="center">
                <Avatar size={"lg"} name="Nahte" />
                <Text>{player.name}</Text>
                <Badge>Grade {player.grade}</Badge>
            </Stack>
        </Paper>
    );
}
