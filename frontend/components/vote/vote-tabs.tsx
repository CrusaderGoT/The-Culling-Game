"use client";

import { PlayerInfo } from "@/api/client";
import { Avatar, MantineColor, Tabs, Text } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { VoteCards } from "./forms/vote-form";

export function VoteTabs({ players, value, setValue }: VoteTabsProp) {
    const colors: MantineColor[] = [
        "dark",
        "gray",
        "red",
        "pink",
        "grape",
        "violet",
        "indigo",
        "blue",
        "cyan",
        "teal",
        "green",
        "lime",
        "yellow",
        "orange",
    ];

    const getColorFromId = (id: PlayerInfo["id"]): MantineColor => {
        const hash = Array.from(id.toString()).reduce(
            (acc, char) => acc + char.charCodeAt(0),
            0
        );
        return colors[hash % colors.length] || "gray";
    };

    return (
        <Tabs variant="pills" defaultValue={players[0]?.name || "default"}>
            <Tabs.List grow>
                {players.map((player) => (
                    <Tabs.Tab
                        key={player.id}
                        value={player.name}
                        leftSection={<Avatar name={player.name} size={18} />}
                        color={getColorFromId(player.id)}
                    >
                        {player.name}
                    </Tabs.Tab>
                ))}
            </Tabs.List>

            {players.map((player) => (
                <Tabs.Panel key={player.id} value={player.name} p={"xs"}>
                    <VoteCards
                        value={value}
                        setValue={setValue}
                        player={player}
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
