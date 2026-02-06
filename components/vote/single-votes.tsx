"use client";

import { BaseCtAppInfo, MatchInfo, PlayerInfo } from "@/api/client";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useCastVote } from "@/lib/hooks/matches";
import { getColorFromId } from "@/lib/utils";
import { ActionIcon, Text, Tooltip } from "@mantine/core";
import {
    Icon,
    IconBombFilled,
    IconBow,
    IconHandGrab,
    IconKarate,
    IconShieldFilled,
    IconSwords
} from "@tabler/icons-react";

type SingleVoteGroupProp = {
    applications: PlayerInfo["cursed_technique"]["applications"];
    match: MatchInfo;
    playerId: number;
    ended: boolean;
};

export function SingleVoteGroup({
    applications,
    match,
    playerId,
    ended,
}: SingleVoteGroupProp) {
    const appIcons = [
        IconSwords,
        IconShieldFilled,
        IconBow,
        IconBombFilled,
        IconHandGrab,
    ];

    const appGroup = applications.map((app, index) => {
        const prevVotes = match.votes.filter(
            (vote) => vote.ct_app_id === app.id
        ).length;

        const icon = appIcons[index];

        return (
            <SingleVote
                key={index}
                matchId={match.id}
                application={app}
                playerId={playerId}
                prevVotes={prevVotes}
                icon={icon}
                ended={ended}
            />
        );
    });

    return <ActionIcon.Group>{appGroup}</ActionIcon.Group>;
}

type SingleVoteProp = {
    matchId: number;
    application: BaseCtAppInfo;
    playerId: number;
    prevVotes: number;
    icon?: Icon;
    ended: boolean;
};

function SingleVote({
    matchId,
    application,
    playerId,
    prevVotes,
    icon = IconKarate,
    ended,
}: SingleVoteProp) {
    const { token } = useAuth();

    const { mutateAsync, isPending, reset } = useCastVote(token);

    const AppIcon = icon;

    return (
        <>
            <ActionIcon
                variant="subtle"
                size="xs"
                flex={1}
                onClick={async () => {
                    try {
                        await mutateAsync({
                            path: { match_id: matchId },
                            body: [
                                {
                                    player_id: playerId,
                                    ct_app_id: application.id,
                                },
                            ],
                        });
                    } catch (e) {
                        reset();
                    }
                }}
                loading={isPending}
                color={getColorFromId(application.id)}
                disabled={ended}
            >
                <Tooltip
                    label={
                        ended ? "match ended" : `vote for ${application.name}`
                    }
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <AppIcon size={18} />
                </Tooltip>
            </ActionIcon>

            <ActionIcon.GroupSection
                variant="light"
                size="xs"
                flex={1}
                color={getColorFromId(playerId)}
            >
                <Tooltip
                    label={`${application.name} ${
                        ended ? "had" : "has"
                    } ${prevVotes} vote(s)`}
                    multiline
                    maw={200}
                    events={{ focus: false, hover: true, touch: true }}
                >
                    <Text size="xs">{prevVotes}</Text>
                </Tooltip>
            </ActionIcon.GroupSection>
        </>
    );
}
