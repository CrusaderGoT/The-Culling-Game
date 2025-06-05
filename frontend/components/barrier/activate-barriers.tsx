"use client";

import { BarrierTechInfo, MatchInfo } from "@/api/client";
import { BindingVowAction } from "@/components/barrier/binding-vow";
import { DomainExpansionAction } from "@/components/barrier/domain-expansion";
import { SimpleDomainAction } from "@/components/barrier/simple-domain";
import { ActionIcon } from "@mantine/core";

export type BarrierTechActionProp = {
    barrierTech: BarrierTechInfo;
    match: MatchInfo;
    ended: boolean;
};

export function MatchActivateBarriers({
    barrierTech,
    match,
    ended,
}: BarrierTechActionProp) {
    return (
        <ActionIcon.Group>
            <DomainExpansionAction
                match={match}
                barrierTech={barrierTech}
                ended={ended}
            />
            <SimpleDomainAction
                match={match}
                barrierTech={barrierTech}
                ended={ended}
            />
            <BindingVowAction
                match={match}
                barrierTech={barrierTech}
                ended={ended}
            />
        </ActionIcon.Group>
    );
}
