"use client";

import { BarrierTechActionProp } from "@/components/barrier/activate-barriers";
import { useAuth } from "@/lib/contexts/auth-provider";
import { useBindingVow } from "@/lib/hooks/barrier";
import { getColorFromId } from "@/lib/utils";
import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { IconLink } from "@tabler/icons-react";
import { useMemo } from "react";

export function BindingVowAction({
    barrierTech,
    match,
    ended,
}: BarrierTechActionProp) {
    const { token } = useAuth();
    const { mutateAsync, isPending } = useBindingVow(token);

    const bindingVowUse = useMemo(() => {
        const usage = match.barrier_records
            .filter((record) => record.barrier_tech_id === barrierTech.id)
            .map((playerRecord) => {
                return playerRecord.binding_vow_counter || 0;
            })
            .reduce((acc, curr) => acc + curr, 0);

        return usage;
    }, [match.barrier_records, barrierTech.id]);

    return (
        <>
            <ActionIcon
                variant="subtle"
                size="xs"
                flex={1}
                loading={isPending}
                color={getColorFromId(bindingVowUse)}
                onClick={async () => {
                    await mutateAsync({
                        path: { player_id: barrierTech.player_id },
                        query: { match_id: match.id },
                    });
                }}
                disabled={ended}
            >
                <Tooltip
                    label={ended ? "match ended" : "activate binding vow"}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <IconLink />
                </Tooltip>
            </ActionIcon>
            <ActionIcon.GroupSection
                variant="light"
                size="xs"
                flex={1}
                color={getColorFromId(bindingVowUse)}
            >
                <Tooltip
                    label={`activated ${bindingVowUse} times`}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <Text size="xs">{bindingVowUse}</Text>
                </Tooltip>
            </ActionIcon.GroupSection>
        </>
    );
}
