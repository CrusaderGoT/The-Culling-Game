"use client";

import { BigActionButton } from "@/components/ui/big-action-button";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useCreateMatch } from "@/lib/hooks/admins";
import {
    Button,
    Flex,
    Group,
    Modal,
    NumberInput,
    Stack
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMatchstick } from "@tabler/icons-react";
import { useState } from "react";
import { getAPIErrorMessage } from "../../ui/display-api-error";

export function CreateMatchAction() {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <Flex>
            <BigActionButton
                onclick={open}
                label="Create Match"
                color="deepred"
                icons={[IconMatchstick]}
            />
            <CreateMatchModal opened={opened} close={close} />
        </Flex>
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

    const { mutateAsync, error, isPending } = useCreateMatch(token);

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
                        disabled={!value || isPending}
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
