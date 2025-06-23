"use client";

import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useShellContext } from "@/lib/contexts/shell-context-provider";
import gstyles from "@/styles/global.module.css";
import { AppShell, ScrollArea } from "@mantine/core";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ShellNavLinks } from "./shell-navlinks";

export function ShellNavbar() {
    const {
        user: { userInfo },
    } = useAuth();

    const { navbarProps } = useShellContext();

    const pathname = usePathname();

    useEffect(() => {
        if (userInfo?.admin && !navbarProps.adminUser) {
            navbarProps.setAdminUser(true);
        }
        return;
    }, [
        userInfo?.admin,
        navbarProps,
        navbarProps.adminUser,
        navbarProps.setAdminUser,
    ]);

    return userInfo?.admin && pathname.startsWith("/admin") ? (
        <AppShell.Navbar p="md" className={gstyles.highZ}>
            <AppShell.Section component={ScrollArea}>
                <ShellNavLinks closeNavbar={navbarProps.toggleMobile} />
            </AppShell.Section>
        </AppShell.Navbar>
    ) : null;
}
