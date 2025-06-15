"use client";

import { Grade, PlayerInfo } from "@/api/client";
import { useAuth } from "@/lib/contexts/auth-provider";
import { useDeletePlayer, useUpgradePlayer } from "@/lib/hooks/players";
import gclasses from "@/styles/global.module.css";
import {
    Alert,
    Button,
    FocusTrap,
    Group,
    Modal,
    Slider,
    Stack,
    Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
    Icon,
    IconAirBalloonFilled,
    IconAlertTriangleFilled,
    IconMoodUp,
    IconMountainFilled,
    IconNorthStar,
    IconVolcano,
    IconWaterpolo,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { EditPlayerForm } from "./forms/edit-player-form";

export type EditPlayerModalProp = {
    player: PlayerInfo;
    opened: boolean;
    close: () => void;
};

export function EditPlayerModal({
    player,
    opened,
    close,
}: EditPlayerModalProp) {
    const isMobile = useMediaQuery("(max-width: 50em)");

    return (
        <Modal
            title={`Edit Player ${player.name}`}
            opened={opened}
            onClose={close}
            fullScreen={isMobile}
            radius={0}
            transitionProps={{ transition: "fade", duration: 200 }}
        >
            <FocusTrap.InitialFocus />
            <EditPlayerForm player={player} />
        </Modal>
    );
}

export type DeletePlayerModalProp = EditPlayerModalProp;

export function DeletePlayerModal({
    player,
    opened,
    close,
}: DeletePlayerModalProp) {
    const { token } = useAuth();
    const { mutateAsync, isPending } = useDeletePlayer(token);
    return (
        <Modal
            title={`Delete Player ${player.name}`}
            opened={opened}
            onClose={close}
            transitionProps={{ transition: "fade", duration: 200 }}
        >
            <Stack>
                <Alert
                    title="Are You Super Sure You Want To Delete Your Player?"
                    color="red.9"
                    icon={<IconAlertTriangleFilled />}
                >
                    <Text>
                        Once Player is deleted, It can no longer participate in
                        matches. If the player had prior matches, it can be
                        recovered (contact an admin). If player had no prior
                        match, it will be deleted permanently.
                        {player.matches.length > 0
                            ? " Consider editing your player instead"
                            : ""}
                    </Text>
                </Alert>

                <Group justify="space-between">
                    <Button
                        onClick={() => close()}
                        size="compact-xs"
                        variant="default"
                        disabled={isPending}
                    >
                        cancel
                    </Button>

                    <Button
                        onClick={async () => {
                            mutateAsync({ path: { player_id: player.id } });
                        }}
                        size="compact-xs"
                        color="red.9"
                        disabled={isPending}
                    >
                        confirm
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

type UpgradePlayerSliderProp = { player: PlayerInfo };

export function UpgradePlayerSlider({ player }: UpgradePlayerSliderProp) {
    const isMobile = useMediaQuery("(max-width: 50em)");

    const [endValue, setEndValue] = useState<Grade>(player.grade);

    const grades = [
        { value: Grade[4], label: "Grade 4" },
        { value: Grade[3], label: "Grade 3" },
        { value: Grade[2], label: "Grade 2" },
        { value: Grade[1], label: "Grade 1" },
        { value: Grade[0], label: "Special Grade" },
    ];

    const ThumbIcon = useMemo(() => {
        const icons: Icon[] = [
            IconVolcano,
            IconMountainFilled,
            IconNorthStar,
            IconAirBalloonFilled,
            IconWaterpolo,
        ];
        const selectIcon = icons[endValue] || IconMoodUp;
        return selectIcon;
    }, [endValue]);

    const { token } = useAuth();

    const { mutateAsync, isPending } = useUpgradePlayer(token);

    return (
        <Group align="center">
            <Slider
                defaultValue={player.grade}
                min={0}
                max={4}
                inverted
                label={(val) =>
                    grades.find((grade) => grade.value === val)?.label
                }
                labelAlwaysOn
                marks={grades}
                restrictToMarks
                labelTransitionProps={{
                    transition: "skew-down",
                    duration: 150,
                    timingFunction: "linear",
                }}
                onChangeEnd={(val) => setEndValue(val as Grade)}
                styles={{ thumb: { borderWidth: 2, padding: 3 } }}
                thumbSize={26}
                thumbChildren={<ThumbIcon />}
                flex={1}
                classNames={{ markLabel: isMobile ? gclasses.markLabel : "" }}
                disabled={player.grade === Grade[0]}
            />

            {endValue !== player.grade && player.grade > endValue && (
                <Button
                    size="compact-xs"
                    onClick={async () => {
                        await mutateAsync({
                            path: { player_id: player.id },
                            query: { grade_up: endValue },
                        });
                    }}
                    disabled={isPending}
                >
                    upgrade
                </Button>
            )}
        </Group>
    );
}
