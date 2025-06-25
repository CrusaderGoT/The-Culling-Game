"use client";

import { BigActionButton } from "@/components/ui/big-action-button";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-context-provider";
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
import { IconMatchstick, IconTrash, IconTrashX } from "@tabler/icons-react";
import { useState } from "react";

export function DeleteMatchAction({ small = false }: { small?: boolean }) {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <Flex justify={"space-evenly"}>
            {small ? (
                <DeleteMatchButtonSmall open={open} />
            ) : (
                <BigActionButton
                    onclick={open}
                    label="Delete Match"
                    color="violet"
                    icons={[IconTrash, IconMatchstick]}
                />
            )}

            <DeleteMatchModal opened={opened} close={close} />
        </Flex>
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

    const { mutateAsync, error, isPending } = useDeleteMatch(token);

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
                    label="Match number"
                    withAsterisk
                    description="Match number to Delete"
                    placeholder="enter match number"
                    value={value}
                    onChange={setValue}
                    clampBehavior="strict"
                    min={1}
                    allowNegative={false}
                    allowDecimal={false}
                    prefix="No. "
                    leftSection={<IconTrash />}
                    error={error && getAPIErrorMessage(error)}
                />
                <Group justify="space-between">
                    <Button
                        disabled={!value || isPending}
                        onClick={async () => {
                            await mutateAsync({
                                path: {
                                    match_id: Number(value),
                                },
                            });
                        }}
                        color="red"
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

export function DeleteMatchButtonSmall({ open }: { open: () => void }) {
    return (
        <Tooltip
            label="Delete Match"
            events={{ focus: false, hover: true, touch: true }}
        >
            <ActionIcon
                onClick={open}
                color="deepred"
                size={"xs"}
                variant="subtle"
            >
                <IconTrashX size={16} />
            </ActionIcon>
        </Tooltip>
    );
}
