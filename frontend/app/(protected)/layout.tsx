// app/(protected)/layout.tsx

import { verifySession } from "@/lib/auth/session";

import { UserMenu } from "@/components/ui/user-menu";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { Group, Stack } from "@mantine/core";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const token = await verifySession();

    return (
        <AuthProvider token={token}>
            <Stack>
                <Group justify="flex-end">
                    <UserMenu />
                </Group>
                {children}
            </Stack>
        </AuthProvider>
    );
}
