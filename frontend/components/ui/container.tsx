"use client";

import { UserMenu } from "@/components/ui/user-menu";
import { useAuth } from "@/lib/contexts/auth-provider";
import gclasses from "@/styles/global.module.css";
import { ActionIcon, Alert, AppShell, Center, Group } from "@mantine/core";
import { IconHome, IconNetworkOff } from "@tabler/icons-react";
import clsx from "clsx";
import Link from "next/link";

export function MainContainer({ children }: { children: React.ReactNode }) {
    const { isOnline } = useAuth();

    return (
        <AppShell
            header={{
                height: { base: 50, "640px": 70 },
            }}
            padding={"md"}
        >
            <AppShell.Header>
                <Group
                    justify="flex-end"
                    align="center"
                    gap={"xl"}
                    p={{ base: "xs", "640px": "md" }}
                    pr={"md"}
                    className={clsx(gclasses.highZ)}
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
                {!isOnline && (
                    <Center className={clsx(gclasses.offline)}>
                        <Alert
                            title="You are Offline"
                            icon={<IconNetworkOff />}
                            color="red.9"
                        />
                    </Center>
                )}
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
