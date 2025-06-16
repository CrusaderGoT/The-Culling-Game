"use client";

import { UserMenu } from "@/components/ui/user-menu";
import { useAuth } from "@/lib/contexts/auth-provider";
import gstyles from "@/styles/global.module.css";
import {
    ActionIcon,
    Alert,
    AppShell,
    Burger,
    Center,
    Group,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconHome, IconNetworkOff } from "@tabler/icons-react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainContainer({ children }: { children: React.ReactNode }) {
    const {
        isOnline,
        user: { userInfo },
    } = useAuth();

    const pathname = usePathname();

    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

    return (
        <AppShell
            header={{
                height: { base: 50, "640px": 70 },
            }}
            navbar={
                userInfo?.admin && pathname.startsWith("/admin")
                    ? {
                          width: 300,
                          breakpoint: "sm",
                          collapsed: {
                              mobile: !mobileOpened,
                              desktop: !desktopOpened,
                          },
                      }
                    : undefined
            }
            padding={"md"}
        >
            <AppShell.Header>
                <Group
                    justify="right"
                    align="center"
                    gap={"xl"}
                    p={{ base: "xs", "640px": "md" }}
                    pr={"md"}
                    className={clsx(gstyles.highZ)}
                >
                    <ActionIcon
                        variant="transparent"
                        component={Link}
                        href="/match"
                    >
                        <IconHome />
                    </ActionIcon>

                    <UserMenu />

                    {userInfo?.admin && pathname.startsWith("/admin") && (
                        <>
                            <Burger
                                opened={mobileOpened}
                                onClick={toggleMobile}
                                hiddenFrom="sm"
                                size="sm"
                            />
                            <Burger
                                opened={desktopOpened}
                                onClick={toggleDesktop}
                                visibleFrom="sm"
                                size="sm"
                            />
                        </>
                    )}
                </Group>
            </AppShell.Header>

            {userInfo?.admin && pathname.startsWith("/admin") && (
                <AppShell.Navbar p="md">Navbar</AppShell.Navbar>
            )}

            <AppShell.Main>
                {!isOnline && (
                    <Center className={clsx(gstyles.offline)}>
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
