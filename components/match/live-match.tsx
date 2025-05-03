"use client";

import { Card, CardSection } from "@mantine/core";

import { MatchPlayers } from "@/components/match/match-players";
import { MatchStatusHeader } from "@/components/match/match-status-header";
import { MatchVoteChart } from "@/components/match/match-vote-chart";
import { VoteDrawer } from "@/components/vote/vote-drawer";

import { MatchInfo, PlayerInfo } from "@/api/client";

type LiveMatchProp = {
    players: PlayerInfo[];
    match: MatchInfo;
};
export function LiveMatch({ players, match }: LiveMatchProp) {
    return (
        <Card padding={"xs"}>
            <CardSection p={"xs"}>
                <MatchStatusHeader match={match} />
            </CardSection>

            <MatchPlayers />

            <CardSection p={"xs"} pr={"xl"}>
                <MatchVoteChart />
            </CardSection>

            <CardSection mx={"auto"} p={"xs"}>
                <VoteDrawer players={players} />
            </CardSection>
        </Card>
    );
}
