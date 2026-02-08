"use client";

import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useShellContext } from "@/lib/contexts/shell-context-provider";
import { AppShell, ScrollArea } from "@mantine/core";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ShellNavLinks } from "./shell-navlinks";

export function ShellNavbar() {
    const { user } = useAuth();

    const { navbarProps } = useShellContext();

    const pathname = usePathname();

    useEffect(() => {
        if (user?.admin && !navbarProps.adminUser) {
            navbarProps.setAdminUser(true);
        }
        return;
    }, [
        user?.admin,
        navbarProps,
        navbarProps.adminUser,
        navbarProps.setAdminUser,
    ]);

    return user?.admin && pathname.startsWith("/admin") ? (
        <AppShell.Navbar p="md">
            <AppShell.Section component={ScrollArea}>
                <ShellNavLinks closeNavbar={navbarProps.toggleMobile} />
            </AppShell.Section>
        </AppShell.Navbar>
    ) : null;
}
