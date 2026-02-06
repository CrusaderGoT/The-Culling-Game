"use client";

import { PlayerInfo } from "@/api/client";
import { VoteCards } from "@/components/vote/vote-cards";
import { getColorFromId } from "@/lib/utils";
import { Avatar, ScrollArea, Tabs, Text } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";

export function VoteTabs({ players, value, setValue }: VoteTabsProp) {
    return (
        <Tabs
            data-autofocus
            variant="pills"
            defaultValue={players[0]?.id ? `${players[0].id}` : "default"}
        >
            <Tabs.List grow>
                {players.map((player) => (
                    <Tabs.Tab
                        key={player.id}
                        value={`${player.id}`}
                        leftSection={
                            <Avatar
                                name={player.name}
                                src={player.picture}
                                size={18}
                            />
                        }
                        color={getColorFromId(player.id)}
                    >
                        {player.name}
                    </Tabs.Tab>
                ))}
            </Tabs.List>

            {players.map((player) => (
                <Tabs.Panel
                    key={player.id}
                    value={`${player.id}`}
                    p={"sm"}
                    component={ScrollArea}
                    h={285}
                >
                    <VoteCards
                        value={value}
                        setValue={setValue}
                        player={player}
                        color={getColorFromId(player.id)}
                    />
                </Tabs.Panel>
            ))}

            <Tabs.Panel key={"default-panel"} value={"default"} p={"xs"}>
                <Text>No Players Available</Text>
            </Tabs.Panel>
        </Tabs>
    );
}
export type VoteTabsProp = {
    players: PlayerInfo[];
    value: string[];
    setValue: Dispatch<SetStateAction<string[]>>;
};
