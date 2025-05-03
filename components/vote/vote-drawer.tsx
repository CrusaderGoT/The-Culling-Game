"use client";

import { CastVote, PlayerInfo } from "@/api/client";
import { VoteForm } from "@/components/vote/forms/vote-form";
import { VoteTabs } from "@/components/vote/vote-tabs";
import {
    Box,
    Button,
    Dialog,
    Drawer,
    Group,
    Text,
    useDrawersStack,
} from "@mantine/core";
import { useMemo, useState } from "react";

import exceedVoteClasses from "@/styles/exceed-vote.module.css";
import { IconAlertCircle } from "@tabler/icons-react";
import cx from "clsx";

export function VoteDrawer({ players }: VoteDrawerProp) {
    const stack = useDrawersStack(["voting-info", "vote-tab", "confirm-vote"]);

    const [selectedVotes, setSelectedVotes] = useState<string[]>([]);

    const makeVotes = (value: string[]) => {
        return value.map((vote: string) => JSON.parse(vote) as CastVote);
    };

    const votes = useMemo(() => makeVotes(selectedVotes), [selectedVotes]);

    return (
        <Box>
            <Drawer.Stack>
                <Drawer
                    {...stack.register("voting-info")}
                    title="⚠️ IMPORTANT!!! ⚠️"
                    position="top"
                    transitionProps={{ transition: "pop" }}
                    offset={10}
                    
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
                        value={selectedVotes}
                        setValue={setSelectedVotes}
                        players={players}
                    />

                    <Button
                        onClick={() => {
                            // check vote counts
                            if (selectedVotes.length > 5)
                                return alert("Total votes must not exceed 5");
                            if (selectedVotes.length < 1)
                                return alert("Total votes must be at least 1");

                            stack.closeAll();
                            stack.open("confirm-vote");
                        }}
                        color={
                            !selectedVotes.length
                                ? "charcoal"
                                : selectedVotes.length < 5
                                ? "teal"
                                : "orange"
                        }
                    >
                        Cast {selectedVotes.length} Votes
                    </Button>

                    <Dialog
                        opened={votes.length > 5}
                        withBorder
                        withinPortal={false}
                        position={{ bottom: 20, left: 10 }}
                        className={cx(exceedVoteClasses.warningContainer)}
                    >
                        <Group wrap="nowrap">
                            <IconAlertCircle color="red" />
                            <Text
                                className={cx(exceedVoteClasses.warningText)}
                                truncate="start"
                                flex={1}
                            >
                                Total votes must not exceed 5
                            </Text>
                        </Group>
                    </Dialog>
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
