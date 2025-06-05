"use client";

import { MatchInfo, PlayerInfo } from "@/api/client";
import { Box, Center, Flex, ThemeIcon } from "@mantine/core";

import { PlayerCard } from "@/components/player/player-card";
import { IconVs } from "@tabler/icons-react";
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
                            <PlayerCard
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
