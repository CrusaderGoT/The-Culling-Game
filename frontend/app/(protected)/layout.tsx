import { UserMenu } from "@/components/ui/user-menu";
import { Box, Group } from "@mantine/core";

import { sessionUser } from "@/lib/auth/dal";
import Link from "next/link";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await sessionUser("/match");

    if (!user)
        return (
            <Group justify="flex-end">
                <Link href={"/login"}>Login</Link>
                <Link href={"/signup"}>Create User</Link>
            </Group>
        );

    return (
        <Box>
            <Group justify="flex-end">
                <UserMenu user={user} />
            </Group>
            {children}
        </Box>
    );
}
