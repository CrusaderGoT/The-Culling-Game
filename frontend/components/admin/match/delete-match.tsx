"use client";

import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-provider";
import { useDeleteMatch } from "@/lib/hooks/admins";
import {
    ActionIcon,
    Button,
    Flex,
    Group,
    Modal,
    NumberInput,
    Stack,
    Tooltip,
    TooltipFloating,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
    IconMatchstick,
    IconTrash,
    IconTrashFilled,
} from "@tabler/icons-react";
import { useState } from "react";

export function DeleteMatchAction() {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <Flex>
            <DeleteMatchButton open={open} />

            <DeleteMatchModal opened={opened} close={close} />
        </Flex>
    );
}

function DeleteMatchButton({ open }: { open: () => void }) {
    return (
        <TooltipFloating label="Delete Match">
            <ActionIcon flex={1} h={200} onClick={open} color="deepred">
                <Group gap={"xs"}>
                    <IconTrash size={50} /> <IconMatchstick size={50} />
                </Group>
            </ActionIcon>
        </TooltipFloating>
    );
}

function DeleteMatchModal({
    opened,
    close,
}: {
    opened: boolean;
    close: () => void;
}) {
    const { token } = useAuth();

    const [value, setValue] = useState<string | number>("");

    const { mutateAsync, error } = useDeleteMatch(token);

    return (
        <Modal
            opened={opened}
            onClose={close}
            title="Delete a new Match"
            centered
            size={"xs"}
        >
            <Stack>
                <NumberInput
                    label="Part"
                    withAsterisk
                    description="Match part to Delete"
                    placeholder="try the current match number or higher"
                    value={value}
                    onChange={setValue}
                    clampBehavior="strict"
                    min={1}
                    allowNegative={false}
                    allowDecimal={false}
                    prefix="Part "
                    leftSection={<IconMatchstick />}
                    error={error && getAPIErrorMessage(error)}
                />
                <Group justify="space-between">
                    <Button
                        disabled={!value}
                        onClick={async () => {
                            await mutateAsync({
                                query: {
                                    match_id: Number(value),
                                },
                            });
                        }}
                    >
                        Delete Match
                    </Button>
                    <Button variant="default" onClick={() => close()}>
                        Close
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export function DeleteMatchAction2({ matchId }: { matchId: number }) {
    const { token } = useAuth();

    const { mutateAsync } = useDeleteMatch(token);

    return (
        <Tooltip
            label="Delete Match"
            events={{ focus: false, hover: true, touch: true }}
        >
            <ActionIcon
                onClick={async () => {
                    await mutateAsync({
                        query: {
                            match_id: matchId,
                        },
                    });
                }}
                color="deepred"
                size={"xs"}
            >
                <IconTrashFilled size={16} />
            </ActionIcon>
        </Tooltip>
    );
}
