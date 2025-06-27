"use client";

import { BigActionButton } from "@/components/ui/big-action-button";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useAssignMatchWinner } from "@/lib/hooks/admins/match";
import {
    ActionIcon,
    Button,
    Flex,
    Group,
    Modal,
    NumberInput,
    Stack,
    Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCrown, IconMatchstick } from "@tabler/icons-react";
import { useState } from "react";

export function AssignMatchWinnerAction({
    small = false,
}: {
    small?: boolean;
}) {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <Flex justify={"space-evenly"}>
            {small ? (
                <AssignMatchWinnerButtonSmall open={open} />
            ) : (
                <BigActionButton
                    onclick={open}
                    label="Assign Match Winner"
                    color="blue"
                    icons={[IconCrown, IconMatchstick]}
                />
            )}

            <AssignMatchWinnerModal opened={opened} close={close} />
        </Flex>
    );
}

function AssignMatchWinnerModal({
    opened,
    close,
}: {
    opened: boolean;
    close: () => void;
}) {
    const { token } = useAuth();

    const [value, setValue] = useState<string | number>("");

    const { mutateAsync, error, isPending } = useAssignMatchWinner(token);

    return (
        <Modal
            opened={opened}
            onClose={close}
            title="Assign Winner to a Match"
            centered
            size={"xs"}
        >
            <Stack>
                <NumberInput
                    label="Match number"
                    withAsterisk
                    description="Match number to Assign Winner"
                    placeholder="enter match number"
                    value={value}
                    onChange={setValue}
                    clampBehavior="strict"
                    min={1}
                    allowNegative={false}
                    allowDecimal={false}
                    prefix="No. "
                    leftSection={<IconCrown />}
                    error={error && value && getAPIErrorMessage(error)}
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
                        color="grape"
                    >
                        Assign Match Winner
                    </Button>
                    <Button variant="default" onClick={() => close()}>
                        Close
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export function AssignMatchWinnerButtonSmall({ open }: { open: () => void }) {
    return (
        <Tooltip
            label="Assign Match Winner"
            events={{ focus: false, hover: true, touch: true }}
        >
            <ActionIcon
                onClick={open}
                color="grape"
                size={"xs"}
                variant="subtle"
            >
                <IconCrown size={16} />
            </ActionIcon>
        </Tooltip>
    );
}
