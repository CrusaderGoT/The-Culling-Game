"use client";

import { BarrierTechActionProp } from "@/components/barrier/activate-barriers";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useSimpleDomain } from "@/lib/hooks/barriers";
import { getColorFromId } from "@/lib/utils";
import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { IconDiscFilled } from "@tabler/icons-react";
import { useMemo } from "react";

export function SimpleDomainAction({
    barrierTech,
    match,
    ended,
}: BarrierTechActionProp) {
    const {
        token,
        user: { userInfo },
    } = useAuth();
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
                    label={ended ? "match ended" : "activate simple domain"}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <IconDiscFilled size={18} />
                </Tooltip>
            </ActionIcon>
            <ActionIcon.GroupSection
                variant="light"
                size="xs"
                flex={1}
                color={getColorFromId(simpleDomainUse)}
            >
                <Tooltip
                    label={`activated simple domain ${simpleDomainUse} times`}
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
