"use client";

import { BigActionButton } from "@/components/ui/big-action-button";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useCreateAdmin } from "@/lib/hooks/admins/admin";
import { Button, Flex, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconUserShield, IconUserUp } from "@tabler/icons-react";
import { useState } from "react";
import { getAPIErrorMessage } from "../../ui/display-api-error";

export function CreateAdminAction() {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <Flex>
            <BigActionButton
                onclick={open}
                label="Create Admin"
                color="green"
                icons={[IconUserShield]}
            />
            <CreateAdminModal opened={opened} close={close} />
        </Flex>
    );
}

function CreateAdminModal({
    opened,
    close,
}: {
    opened: boolean;
    close: () => void;
}) {
    const { token } = useAuth();

    const { mutateAsync, error, isPending } = useCreateAdmin(token);

    const [value, setValue] = useState<string>("");

    return (
        <Modal
            opened={opened}
            onClose={close}
            title="Create a new Admin"
            centered
            size={"xs"}
        >
            <Stack>
                <TextInput
                    label="Part"
                    withAsterisk
                    description="Match part to create"
                    placeholder="try the current match number or higher"
                    leftSection={<IconUserUp />}
                    error={error && getAPIErrorMessage(error)}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Group justify="space-between">
                    <Button disabled={!value || isPending}>Create Admin</Button>
                    <Button variant="default" onClick={() => close()}>
                        Close
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
