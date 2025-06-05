import { BarrierTechInfo, MatchInfo } from "@/api/client";
import { ActionIcon } from "@mantine/core";
import { DomainExpansionAction } from "./domain-expansion";

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
        </ActionIcon.Group>
    );
}
