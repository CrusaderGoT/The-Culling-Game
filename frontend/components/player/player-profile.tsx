"use client";

import { PlayerInfo } from "@/api/client";
import { CreatePlayerForm } from "@/components/player/forms/create-player-form";
import { PlayerCard } from "@/components/player/player-card";
import {
    DeletePlayerModal,
    EditPlayerModal,
    UpgradePlayerSlider,
} from "@/components/player/player-crud";
import { DisplayAPIError } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-provider";
import { useCurrentPlayer } from "@/lib/hooks/players";
import { calculateCtAppPoints } from "@/lib/utils";
import { DonutChart } from "@mantine/charts";
import {
    Button,
    Group,
    Skeleton,
    Space,
    Stack,
    Text,
    Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconInfoCircle } from "@tabler/icons-react";

export function PlayerProfile() {
    const { token } = useAuth();
    const player = useCurrentPlayer(token);

    const [openedEditPlayer, { close: closeEditPlayer, open: openEditPlayer }] =
        useDisclosure();
    const [
        openedDeletePlayer,
        { close: closeDeletePlayer, open: openDeletePlayer },
    ] = useDisclosure();

    // Show loading while token is being loaded or query is pending
    if (!token || player.isPending) {
        return <Skeleton width="100%" height={400} mx="auto" />;
    }

    // Handle query errors
    if (player.isError) {
        return (
            <Stack>
                <DisplayAPIError error={player.error} color="gold" />
                <CreatePlayerForm />
            </Stack>
        );
    }

    // Now we can safely check the data
    if (!player.data) {
        return <CreatePlayerForm />;
    } else {
        return (
            <Stack mx="auto">
                <EditPlayerModal
                    player={player.data}
                    opened={openedEditPlayer}
                    close={closeEditPlayer}
                />
                <DeletePlayerModal
                    player={player.data}
                    opened={openedDeletePlayer}
                    close={closeDeletePlayer}
                />
                <Group justify="space-between">
                    <Button size="compact-xs" onClick={openEditPlayer}>
                        Edit Player
                    </Button>
                    <Button
                        size="compact-xs"
                        color="red"
                        onClick={openDeletePlayer}
                    >
                        Delete Player
                    </Button>
                </Group>
                <PlayerCard player={player.data} />
                {player.data.grade > 0 && (
                    <Group justify="center" gap={3}>
                        <Text size="sm" c={"deepred"}>
                            Upgrade Your Player
                        </Text>
                        <Tooltip
                            label={"upgrade to access more advanced techniques"}
                            events={{ focus: false, hover: true, touch: true }}
                        >
                            <IconInfoCircle size={12} />
                        </Tooltip>
                    </Group>
                )}
                <UpgradePlayerSlider player={player.data} />

                <Space />

                <Text ta={"center"} size="sm">
                    Player Charts
                </Text>
                <Group gap={"xs"}>
                    <PlayerCtAppVoteChart player={player.data} />
                </Group>
            </Stack>
        );
    }
}

function PlayerCtAppVoteChart({ player }: { player: PlayerInfo }) {
    const data = calculateCtAppPoints(player);

    return (
        <DonutChart
            data={data}
            tooltipDataSource="segment"
            chartLabel={"applications votes"}
            labelsType="percent"
            withLabels
            strokeWidth={5}
            thickness={30}
            size={200}
            flex={1}
        />
    );
}
