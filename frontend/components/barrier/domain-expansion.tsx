"use client";

import { BarrierTechActionProp } from "@/components/barrier/activate-barriers";
import { useAuth } from "@/lib/contexts/auth-provider";
import { useDomainExpansion } from "@/lib/hooks/barrier";
import { getColorFromId } from "@/lib/utils";
import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { IconBalloonFilled } from "@tabler/icons-react";
import { useMemo } from "react";

export function DomainExpansionAction({
    barrierTech,
    match,
    ended,
}: BarrierTechActionProp) {
    const { token } = useAuth();
    const { mutateAsync, isPending } = useDomainExpansion(token);

    const domainUse = useMemo(() => {
        const usage = match.barrier_records
            .filter((record) => record.barrier_tech_id === barrierTech.id)
            .map((playerRecord) => {
                return playerRecord.domain_counter || 0;
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
                color={getColorFromId(domainUse)}
                disabled={ended}
                onClick={async () => {
                    await mutateAsync({
                        path: { player_id: barrierTech.player_id },
                        query: { match_id: match.id },
                    });
                }}
            >
                <Tooltip
                    label={ended ? "match ended" : "activate domain"}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <IconBalloonFilled />
                </Tooltip>
            </ActionIcon>
            <ActionIcon.GroupSection
                variant="light"
                size="xs"
                flex={1}
                color={getColorFromId(domainUse)}
            >
                <Tooltip
                    label={`activated ${domainUse} times`}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <Text size="xs">{domainUse}</Text>
                </Tooltip>
            </ActionIcon.GroupSection>
        </>
    );
}
