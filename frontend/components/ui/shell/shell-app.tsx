"use client";

import { useShellContext } from "@/lib/contexts/shell-context-provider";
import { AppShell, Container } from "@mantine/core";
import { usePathname } from "next/navigation";
import { ShellHeader } from "./shell-header";

export function ShellApp({ children }: { children: React.ReactNode }) {
    const { navbarProps } = useShellContext();

    const pathname = usePathname();

    return (
        <AppShell
            header={{
                height: 50,
            }}
            navbar={
                navbarProps.adminUser && pathname.startsWith("/admin")
                    ? {
                          width: 300,
                          breakpoint: "sm",
                          collapsed: {
                              mobile: !navbarProps.mobileOpened,
                              desktop: !navbarProps.desktopOpened,
                          },
                      }
                    : undefined
            }
            padding={"md"}
        >
            <ShellHeader />

            {/** pos relative for global loading overlay, eg (admin dashboard loading) */}
            <AppShell.Main pos={"relative"}>
                <Container>{children}</Container>
            </AppShell.Main>
        </AppShell>
    );
}
