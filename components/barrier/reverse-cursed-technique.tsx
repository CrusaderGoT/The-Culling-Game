"use client";

import { BarrierTechActionProp } from "@/components/barrier/activate-barriers";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useReverseCursedTechnique } from "@/lib/hooks/barriers";
import { getColorFromId } from "@/lib/utils";
import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { IconHeartPlus } from "@tabler/icons-react";
import { useMemo } from "react";

export function ReverseCursedTechniqueAction({
    barrierTech,
    match,
    ended,
}: BarrierTechActionProp) {
    const {
        token,
        user: { userInfo },
    } = useAuth();
    const { mutateAsync, isPending } = useReverseCursedTechnique(token);

    const rctUse = useMemo(() => {
        const usage = match.barrier_records
            .filter((record) => record.barrier_tech_id === barrierTech.id)
            .map((playerRecord) => {
                return playerRecord.reverse_cursed_technique_counter || 0;
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
                color={getColorFromId(rctUse)}
                disabled={
                    ended || userInfo?.player?.id !== barrierTech.player_id
                }
                onClick={async () => {
                    await mutateAsync({
                        path: {
                            player_id: barrierTech.player_id,
                            match_id: match.id,
                        },
                    });
                }}
            >
                <Tooltip
                    label={ended ? "match ended" : "reverse cursed technique"}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <IconHeartPlus size={18} />
                </Tooltip>
            </ActionIcon>

            <ActionIcon.GroupSection
                variant="light"
                size="xs"
                flex={1}
                color={getColorFromId(rctUse)}
            >
                <Tooltip
                    label={`used reverse cursed technique ${rctUse} times`}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <Text size="xs">{rctUse}</Text>
                </Tooltip>
            </ActionIcon.GroupSection>
        </>
    );
}
