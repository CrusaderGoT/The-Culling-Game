"use client";

import { UserMenu } from "@/components/ui//user-menu";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ActionIcon, AppShell, Burger, Group } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import clsx from "clsx";
import Link from "next/link";

import { useShellContext } from "@/lib/contexts/shell-context-provider";
import gstyles from "@/styles/global.module.css";
import { usePathname } from "next/navigation";

export function ShellHeader() {
    const { navbarProps } = useShellContext();

    const pathname = usePathname();

    const publicPathnames = ["/", "/login", "/signup"];

    return (
        <AppShell.Header withBorder={!publicPathnames.includes(pathname)}>
            <Group justify="space-between" className={clsx(gstyles.highZ)}>
                <ModeToggle />

                <Group
                    justify="flex-end"
                    align="center"
                    gap={"xl"}
                    p={{ base: "xs", "640px": "md" }}
                    pr={"md"}
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

                    {navbarProps.adminUser && pathname.startsWith("/admin") && (
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
            </Group>
        </AppShell.Header>
    );
}
