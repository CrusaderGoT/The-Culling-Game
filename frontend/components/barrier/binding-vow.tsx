"use client";

import { BarrierTechActionProp } from "@/components/barrier/activate-barriers";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useBindingVow } from "@/lib/hooks/barriers";
import { getColorFromId } from "@/lib/utils";
import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { IconLink } from "@tabler/icons-react";
import { useMemo } from "react";

export function BindingVowAction({
    barrierTech,
    match,
    ended,
}: BarrierTechActionProp) {
    const { token, user } = useAuth();
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
                        path: {
                            player_id: barrierTech.player_id,
                            match_id: match.id,
                        },
                    });
                }}
                disabled={ended || user?.player?.id !== barrierTech.player_id}
            >
                <Tooltip
                    label={ended ? "match ended" : "use binding vow"}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <IconLink size={18} />
                </Tooltip>
            </ActionIcon>
            <ActionIcon.GroupSection
                variant="light"
                size="xs"
                flex={1}
                color={getColorFromId(bindingVowUse)}
            >
                <Tooltip
                    label={`used binding vow ${bindingVowUse} times`}
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
