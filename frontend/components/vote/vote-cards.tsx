"use client";

import { PlayerInfo } from "@/api/client";
import {
    Box,
    Checkbox,
    CheckboxGroup,
    Group,
    Popover,
    Stack,
    Text,
} from "@mantine/core";
import { Dispatch, SetStateAction } from "react";

import gstyles from "@/styles/global.module.css";
import styles from "@/styles/vote-card.module.css";
import { useDisclosure } from "@mantine/hooks";
import clsx from "clsx";

type VoteCardProp = {
    player: PlayerInfo;
    value: string[];
    setValue: Dispatch<SetStateAction<string[]>>;
    color: string;
};

export function VoteCards({ player, value, setValue, color }: VoteCardProp) {
    const [opened, { close, open }] = useDisclosure(false);

    const RenderCard = (
        application: (typeof player.cursed_technique.applications)[0]
    ) => {
        const cardValue = JSON.stringify({
            ct_app_id: application.id,
            player_id: player.id,
        });

        const [opened, { close, open }] = useDisclosure(false);

        const isChecked = value.includes(cardValue);

        return (
            <Popover
                width="60%"
                withArrow
                shadow="md"
                opened={opened}
                key={application.id}
            >
                <Popover.Target>
                    <Checkbox.Card
                        key={application.id}
                        radius="md"
                        checked={isChecked}
                        value={cardValue}
                        className={clsx(
                            styles.voteCard,
                            gstyles.wrapSingleLongText
                        )}
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
                        onMouseEnter={open}
                        onMouseLeave={close}
                    >
                        <Group>
                            <Checkbox.Indicator color={`${color}.5`} />
                            <Stack gap="xs">
                                <Text fw={500}>{application.name}</Text>

                                <Text
                                    size="sm"
                                    c={isChecked ? "black" : "dimmed"}
                                    lineClamp={3}
                                    onMouseEnter={open}
                                    onMouseLeave={close}
                                >
                                    {application.application}
                                </Text>
                            </Stack>
                        </Group>
                    </Checkbox.Card>
                </Popover.Target>
                <Popover.Dropdown style={{ pointerEvents: "none" }}>
                    <Text
                        size="sm"
                        className={clsx(gstyles.wrapSingleLongText)}
                    >
                        {application.application}{" "}
                    </Text>
                </Popover.Dropdown>
            </Popover>
        );
    };

    return (
        <Box>
            <CheckboxGroup value={value} onChange={setValue}>
                <Stack gap="xs">
                    {player.cursed_technique.applications.map(RenderCard)}
                </Stack>
            </CheckboxGroup>
        </Box>
    );
}
