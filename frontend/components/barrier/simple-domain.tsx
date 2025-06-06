"use client";

import { BarrierTechActionProp } from "@/components/barrier/activate-barriers";
import { useAuth } from "@/lib/contexts/auth-provider";
import { useSimpleDomain } from "@/lib/hooks/barrier";
import { getColorFromId } from "@/lib/utils";
import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { IconChartBubble } from "@tabler/icons-react";
import { useMemo } from "react";

export function SimpleDomainAction({
    barrierTech,
    match,
    ended,
}: BarrierTechActionProp) {
    const { token } = useAuth();
    const { mutateAsync, isPending } = useSimpleDomain(token);

    const simpleDomainUse = useMemo(() => {
        const usage = match.barrier_records
            .filter((record) => record.barrier_tech_id === barrierTech.id)
            .map((playerRecord) => {
                return playerRecord.simple_domain_counter || 0;
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
                color={getColorFromId(simpleDomainUse)}
                disabled={ended}
                onClick={async () => {
                    await mutateAsync({
                        path: { player_id: barrierTech.player_id },
                        query: { match_id: match.id },
                    });
                }}
            >
                <Tooltip
                    label={ended ? "match ended" : "activate simple domain"}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <IconChartBubble />
                </Tooltip>
            </ActionIcon>
            <ActionIcon.GroupSection
                variant="light"
                size="xs"
                flex={1}
                color={getColorFromId(simpleDomainUse)}
            >
                <Tooltip
                    label={`activated ${simpleDomainUse} times`}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <Text size="xs">{simpleDomainUse}</Text>
                </Tooltip>
            </ActionIcon.GroupSection>
        </>
    );
}
