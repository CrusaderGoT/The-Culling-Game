"use client";

import { useAuth } from "@/lib/contexts/auth-provider";
import { useShellContext } from "@/lib/contexts/shell-context-provider";
import { AppShell } from "@mantine/core";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

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
        <AppShell.Navbar p="md">Navbar{userInfo.admin.id}</AppShell.Navbar>
    ) : null;
}
