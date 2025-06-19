"use client";

import { useShellContext } from "@/lib/contexts/shell-context-provider";
import { AppShell, Container } from "@mantine/core";
import { usePathname } from "next/navigation";

export function ShellApp({ children }: { children: React.ReactNode }) {
    const { navbarProps } = useShellContext();

    const pathname = usePathname();

    return (
        <AppShell
            header={{
                height: { base: 50, "640px": 70 },
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
            <AppShell.Main>
                {/** pos relative for global loading overlay, eg (admin dashboard loading) */}
                <Container pos={"relative"}>{children}</Container>
            </AppShell.Main>
        </AppShell>
    );
}
