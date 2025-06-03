"use client";

import { UserMenu } from "@/components/ui/user-menu";
import { useAuth } from "@/lib/auth/auth-provider";
import globalClasses from "@/styles/global.module.css";
import {
    ActionIcon,
    Alert,
    AppShell,
    Center,
    Container,
    Group,
} from "@mantine/core";
import { IconHome, IconNetworkOff } from "@tabler/icons-react";
import cx from "clsx";
import Link from "next/link";

export function MainContainer({ children }: { children: React.ReactNode }) {
    const { isOnline } = useAuth();

    return (
        <AppShell>
            <AppShell.Header>
                <Group
                    justify="flex-end"
                    align="center"
                    gap={"xl"}
                    p={"xs"}
                    px={"xl"}
                    className={cx(globalClasses.highZ)}
                >
                    <ActionIcon
                        variant="transparent"
                        component={Link}
                        href="/match"
                    >
                        <IconHome />
                    </ActionIcon>

                    <UserMenu />
                </Group>
            </AppShell.Header>

            <AppShell.Main>
                <Container>
                    {!isOnline && (
                        <Center
                            className={cx(
                                globalClasses.offline,
                                globalClasses.highZ
                            )}
                        >
                            <Alert
                                title="You are Offline"
                                icon={<IconNetworkOff />}
                                color="red.9"
                            />
                        </Center>
                    )}
                </Container>
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
