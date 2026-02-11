"use client";

import { PlayerInfo } from "@/apis/client";
import { CreatePlayerForm } from "@/components/player/forms/create-player-form";
import { PlayerCard } from "@/components/player/player-card";
import {
    DeletePlayerModal,
    EditPlayerModal,
    UpgradePlayerSlider,
} from "@/components/player/player-crud";
import { DisplayAPIError } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-context-provider";
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
    Tooltip
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
        return <Skeleton width="100%" height={"85dvh"} mx="auto" />;
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

            {/* Render charts only if the player has participated in matches */}
            {player.data.matches.length > 0 && (
                <>
                    <Text ta={"center"} size="sm">
                        Player Match Charts
                    </Text>
                    <Group>
                        <PlayerCtAppVoteChart player={player.data} />
                    </Group>
                </>
            )}
        </Stack>
    );
}

/**
 * PlayerCtAppVoteChart is a component that visualizes the player's application votes
 * as a donut chart. It uses the `calculateCtAppPoints` utility to process the player's
 * data and displays the results in a graphical format.
 *
 * Props:
 * - player: The PlayerInfo object containing the player's data, including votes.
 */
function PlayerCtAppVoteChart({ player }: { player: PlayerInfo }) {
    if (!player.votes) return null;

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
