"use client";

import { PlayerInfo } from "@/api/client";
import { CreatePlayerForm } from "@/components/player/forms/create-player-form";
import { EditPlayerForm } from "@/components/player/forms/edit-player-form";
import { DisplayAPIError } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-provider";
import { useCurrentPlayer, useDeletePlayer } from "@/lib/hooks/players";
import {
    Alert,
    Button,
    FocusTrap,
    Group,
    Modal,
    Skeleton,
    Stack,
    Text,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { IconAlertTriangleFilled } from "@tabler/icons-react";
import { PlayerCard } from "./player-card";

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
                cursedtechnique card stats
            </Stack>
        );
    }
}

type EditPlayerModalProp = {
    player: PlayerInfo;
    opened: boolean;
    close: () => void;
};

function EditPlayerModal({ player, opened, close }: EditPlayerModalProp) {
    const isMobile = useMediaQuery("(max-width: 50em)");

    return (
        <Modal
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

type DeletePlayerModalProp = EditPlayerModalProp;
function DeletePlayerModal({ player, opened, close }: DeletePlayerModalProp) {
    const { token } = useAuth();
    const { mutateAsync, isPending } = useDeletePlayer(token);
    return (
        <Modal
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
                        recovered (cantact an admin). If player had no prior
                        match, it will be deleted permanently. Consider editing
                        your player instead
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
