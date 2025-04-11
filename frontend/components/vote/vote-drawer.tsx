"use client";

import { PlayerInfo } from "@/api/client";
import { Box, Button, Drawer, Text, useDrawersStack } from "@mantine/core";
import { useState } from "react";
import { VoteForm } from "./forms/vote-form";
import { VoteTabs } from "./vote-tabs";

export function VoteDrawer({ players }: VoteDrawerProp) {
    const [value, setValue] = useState<string[]>([]);

    const stack = useDrawersStack(["voting-info", "vote-tab", "confirm-vote"]);

    return (
        <Box>
            <Drawer.Stack>
                <Drawer
                    {...stack.register("voting-info")}
                    title="⚠️ IMPORTANT!!! ⚠️"
                >
                    <Text lh={2} lts={1.3}>
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
                >
                    <VoteForm votes={JSON.parse(JSON.stringify(value))} />

                    {JSON.parse(JSON.stringify(value))}

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
