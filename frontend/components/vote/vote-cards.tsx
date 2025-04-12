"use client";

import { PlayerInfo } from "@/api/client";
import {
    Box,
    Checkbox,
    CheckboxGroup,
    Group,
    Stack,
    Text,
} from "@mantine/core";
import { Dispatch, SetStateAction } from "react";

import voteClasses from "@/styles/voteCard.module.css";
import cx from "clsx";

type VoteCardProp = {
    player: PlayerInfo;
    value: string[];
    setValue: Dispatch<SetStateAction<string[]>>;
    color: string;
};

export function VoteCards({ player, value, setValue, color }: VoteCardProp) {
    const renderCard = (
        application: (typeof player.cursed_technique.applications)[0]
    ) => {
        const cardValue = JSON.stringify({
            ct_app_id: application.id,
            player_id: player.id,
        });

        const isChecked = value.includes(cardValue);

        return (
            <Checkbox.Card
                key={application.id}
                radius="md"
                checked={isChecked}
                value={cardValue}
                className={cx(voteClasses.voteCard)}
                styles={() => ({
                    card: {
                        backgroundColor: isChecked
                            ? `var(--mantine-color-${color}-filled)`
                            : undefined,
                        borderColor: isChecked
                            ? `var(--mantine-color-${color}-filled)`
                            : undefined,
                    },
                })}
            >
                <Group>
                    <Checkbox.Indicator color={`${color}.5`} />
                    <Stack gap="xs">
                        <Text fw={500}>{application.name}</Text>
                        <Text size="sm" c="dimmed">
                            {application.application}
                        </Text>
                    </Stack>
                </Group>
            </Checkbox.Card>
        );
    };

    return (
        <Box>
            <CheckboxGroup value={value} onChange={setValue}>
                <Stack gap="xs">
                    {player.cursed_technique.applications.map(renderCard)}
                </Stack>
            </CheckboxGroup>
        </Box>
    );
}
