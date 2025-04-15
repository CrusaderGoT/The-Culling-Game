"use client";

import { CastVote, PlayerInfo } from "@/api/client";
import { VoteForm } from "@/components/vote/forms/vote-form";
import { VoteTabs } from "@/components/vote/vote-tabs";
import { Box, Button, Drawer, Text, useDrawersStack } from "@mantine/core";
import { useMemo, useState } from "react";

export function VoteDrawer({ players }: VoteDrawerProp) {
    const stack = useDrawersStack(["voting-info", "vote-tab", "confirm-vote"]);

    const [value, setValue] = useState<string[]>([]);

    const makeVotes = (value: string[]) => {
        return value.map((vote: string) => JSON.parse(vote) as CastVote);
    };

    const votes = useMemo(() => makeVotes(value), [value]);

    return (
        <Box>
            <Drawer.Stack>
                <Drawer
                    {...stack.register("voting-info")}
                    title="⚠️ IMPORTANT!!! ⚠️"
                    position="top"
                    transitionProps={{ transition: "pop" }}
                    offset={10}
                    size={"xs"}
                    overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
                >
                    <Text>
                        Each match allows a maximum of five votes in total.
                        During the voting process, you can select the cursed
                        technique applications you want to vote for each player
                        in their respective tabs. You can only select a total of
                        5 votes across all players, and you must cast at least
                        one vote. Once your votes are cast, they cannot be
                        changed. Choose wisely!
                    </Text>
                    <Button
                        mt={"md"}
                        onClick={() => {
                            stack.closeAll();
                            stack.open("vote-tab");
                        }}
                        color="yellow"
                    >
                        I Understand
                    </Button>
                </Drawer>

                <Drawer
                    {...stack.register("vote-tab")}
                    title="vote awesome techniques"
                    position="bottom"
                    transitionProps={{ transition: "scale" }}
                    offset={10}
                    overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
                >
                    <VoteTabs
                        value={value}
                        setValue={setValue}
                        players={players}
                    />

                    <Button
                        onClick={() => {
                            stack.closeAll();
                            stack.open("confirm-vote");
                        }}
                        color={value.length < 5 ? "teal" : "orange"}
                    >
                        Cast {value.length} Votes
                    </Button>
                </Drawer>

                <Drawer
                    {...stack.register("confirm-vote")}
                    title="confirm your votes"
                    position="right"
                    transitionProps={{ transition: "fade-left" }}
                    offset={10}
                    overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
                >
                    <VoteForm votes={votes} />

                    <Button
                        onClick={() => {
                            stack.closeAll();
                            stack.open("vote-tab");
                        }}
                        color="gray"
                    >
                        Go Back
                    </Button>
                </Drawer>
            </Drawer.Stack>

            <Button
                variant="filled"
                color="green"
                onClick={() => stack.open("voting-info")}
            >
                Vote
            </Button>
        </Box>
    );
}
export type VoteDrawerProp = {
    players: PlayerInfo[];
};
