"use client";

import { CreateMatchAction } from "@/components/admin/match/create-match";
import { DeleteMatchAction } from "@/components/admin/match/delete-match";
import { useAdminContext } from "@/lib/contexts/admin-context-provider";
import { checkAdminPermission } from "@/lib/utils";
import { Skeleton, Stack } from "@mantine/core";

export function MatchActionsInterface() {
    const { admin, isPending } = useAdminContext();

    if (isPending || !admin) {
        return <Skeleton />;
    }

    return (
        <Stack>
            {checkAdminPermission(admin, "match", 2) && <CreateMatchAction />}
            {checkAdminPermission(admin, "match", 4) && <DeleteMatchAction />}
        </Stack>
    );
}
