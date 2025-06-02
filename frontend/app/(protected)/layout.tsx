// app/(protected)/layout.tsx

import { UserMenu } from "@/components/ui/user-menu";
import { AuthProvider } from "@/lib/auth/auth-provider";
import globalClasses from "@/styles/global.module.css";
import { ActionIcon, Group, Stack } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import cx from "clsx";
import Link from "next/link";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <Stack>
                <Group
                    justify="flex-end"
                    align="center"
                    gap={"xl"}
                    p={"xs"}
                    className={cx(globalClasses.stickyTop, globalClasses.blur)}
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
                {children}
            </Stack>
        </AuthProvider>
    );
}
