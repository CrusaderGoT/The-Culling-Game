"use client";

import { PlayerInfo } from "@/api/client";
import { Avatar, Tabs } from "@mantine/core";
import { randomId } from "@mantine/hooks";
import { Dispatch, SetStateAction } from "react";
import { VoteCards } from "./forms/vote-form";

export function VoteTabs({ players, value, setValue }: VoteTabsProp) {
    return (
        <Tabs color="lime" variant="pills" defaultValue="gallery">
            <Tabs.List grow>
                {players.map((player) => (
                    <Tabs.Tab
                        key={randomId()}
                        value={player.name}
                        leftSection={<Avatar name={player.name} size={18} />}
                    >
                        {player.name}
                    </Tabs.Tab>
                ))}
            </Tabs.List>

            {players.map((player) => (
                <Tabs.Panel key={randomId()} value={player.name}>
                    <VoteCards
                        value={value}
                        setValue={setValue}
                        player={player}
                    />
                </Tabs.Panel>
            ))}
        </Tabs>
    );
}
export type VoteTabsProp = {
    players: PlayerInfo[];
    value: string[];
    setValue: Dispatch<SetStateAction<string[]>>;
};
