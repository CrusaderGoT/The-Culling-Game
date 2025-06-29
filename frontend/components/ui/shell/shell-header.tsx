"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { UserMenu } from "@/components/ui/user-menu";
import { ActionIcon, AppShell, Burger, Group } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import Link from "next/link";

import { useShellContext } from "@/lib/contexts/shell-context-provider";
import { usePathname } from "next/navigation";

export function ShellHeader() {
    const { navbarProps } = useShellContext();

    const pathname = usePathname();

    const publicPathnames = ["/", "/login", "/signup"];

    return (
        <AppShell.Header
            withBorder={!publicPathnames.includes(pathname)}
            p={{ base: "xs", "640px": "md" }}
            px={{ base: "md", md: "xl" }}
        >
            <Group justify="space-between">
                <ModeToggle />

                {!publicPathnames.includes(pathname) && (
                    <Group
                        justify="flex-end"
                        align="center"
                        gap={"xl"}
                        flex={1}
                    >
                        <ActionIcon
                            variant="transparent"
                            component={Link}
                            href="/match"
                        >
                            <IconHome />
                        </ActionIcon>

                        <UserMenu />

                        {navbarProps.adminUser &&
                            pathname.startsWith("/admin") && (
                                <>
                                    <Burger
                                        opened={navbarProps.mobileOpened}
                                        onClick={navbarProps.toggleMobile}
                                        hiddenFrom="sm"
                                        size="sm"
                                    />
                                    <Burger
                                        opened={navbarProps.desktopOpened}
                                        onClick={navbarProps.toggleDesktop}
                                        visibleFrom="sm"
                                        size="sm"
                                    />
                                </>
                            )}
                    </Group>
                )}
            </Group>
        </AppShell.Header>
    );
}
