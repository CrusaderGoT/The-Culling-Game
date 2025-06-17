"use client";

import { useAdminContext } from "@/lib/contexts/admin-provider";
import { checkAdminPermission } from "@/lib/utils";
import { Group, Paper, Skeleton } from "@mantine/core";
import { CreateMatchAction } from "./create-match";

export function MatchActionsInterface() {
    const { admin, isPending } = useAdminContext();

    if (isPending || !admin) {
        return <Skeleton />;
    }

    return (
        <Paper withBorder>
            <Group>
                {checkAdminPermission(admin, "match", 2) && (
                    <CreateMatchAction />
                )}
            </Group>
        </Paper>
    );
}
