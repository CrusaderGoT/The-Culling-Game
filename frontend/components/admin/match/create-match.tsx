"use client";

import { useAuth } from "@/lib/contexts/auth-provider";
import { useCreateMatch } from "@/lib/hooks/admins";
import {
    ActionIcon,
    Button,
    Flex,
    Group,
    Modal,
    NumberInput,
    Stack,
    TooltipFloating,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMatchstick } from "@tabler/icons-react";
import { useState } from "react";
import { getAPIErrorMessage } from "../../ui/display-api-error";

export function CreateMatchAction() {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <Flex>
            <CreateMatchButton open={open} />
            <CreateMatchModal opened={opened} close={close} />
        </Flex>
    );
}

function CreateMatchButton({ open }: { open: () => void }) {
    return (
        <TooltipFloating label="Create Match">
            <ActionIcon flex={1} h={200} onClick={open} color="deepred">
                <IconMatchstick size={50} />
            </ActionIcon>
        </TooltipFloating>
    );
}

function CreateMatchModal({
    opened,
    close,
}: {
    opened: boolean;
    close: () => void;
}) {
    const { token } = useAuth();

    const [value, setValue] = useState<string | number>("");

    const { mutateAsync, error } = useCreateMatch(token);

    return (
        <Modal
            opened={opened}
            onClose={close}
            title="Create a new Match"
            centered
            size={"xs"}
        >
            <Stack>
                <NumberInput
                    label="Part"
                    withAsterisk
                    description="Match part to create"
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
                                    part: Number(value),
                                },
                            });
                        }}
                    >
                        Create Match
                    </Button>
                    <Button variant="default" onClick={() => close()}>
                        Close
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
