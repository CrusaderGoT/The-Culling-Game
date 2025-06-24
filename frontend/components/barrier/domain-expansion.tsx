"use client";

import { BarrierTechActionProp } from "@/components/barrier/activate-barriers";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useDomainExpansion } from "@/lib/hooks/barriers";
import { getColorFromId } from "@/lib/utils";
import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { IconSphere } from "@tabler/icons-react";
import { useMemo } from "react";

export function DomainExpansionAction({
    barrierTech,
    match,
    ended,
}: BarrierTechActionProp) {
    const {
        token,
        user: { userInfo },
    } = useAuth();
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
                disabled={
                    ended || userInfo?.player?.id !== barrierTech.player_id
                }
                onClick={async () => {
                    await mutateAsync({
                        path: { player_id: barrierTech.player_id },
                        query: { match_id: match.id },
                    });
                }}
            >
                <Tooltip
                    label={ended ? "match ended" : "domain expansion!"}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <IconSphere size={18} />
                </Tooltip>
            </ActionIcon>
            <ActionIcon.GroupSection
                variant="light"
                size="xs"
                flex={1}
                color={getColorFromId(domainUse)}
            >
                <Tooltip
                    label={`activated domain ${domainUse} times`}
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
