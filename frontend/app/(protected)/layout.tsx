import { UserMenu } from "@/components/ui/main-menu";
import { Box, Group } from "@mantine/core";

import { sessionUser } from "@/lib/auth/dal";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await sessionUser("/match");

    if (!user) redirect("/login");

    return (
        <Box>
            <Group justify="flex-end">
                <UserMenu user={user} />
            </Group>
            {children}
        </Box>
    );
}
