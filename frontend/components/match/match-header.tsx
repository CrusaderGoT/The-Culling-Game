"use client";

import { MatchInfo } from "@/api/client";
import { useAuth } from "@/lib/contexts/auth-provider";
import { checkAdminPermission, getColorFromId } from "@/lib/utils";
import { Badge, Code, Group, Indicator, Text } from "@mantine/core";
import { IconCrown, IconSparkles } from "@tabler/icons-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { DeleteMatchAction2 } from "../admin/match/delete-match";

// Extend dayjs with plugins
dayjs.extend(duration);
dayjs.extend(relativeTime);

export function MatchHeader({
    match,
    isEnded,
    timeLeft,
}: MatchStatusHeaderProp) {
    const {
        user: { userInfo },
    } = useAuth();

    const colony = `${match.colony.id} - ${match.colony.country}`;

    return (
        <Group align="center" justify="space-between">
            <Indicator
                position="middle-start"
                color={isEnded ? "red" : "green"}
                processing={!isEnded}
                withBorder
            >
                <Badge
                    variant="light"
                    size="xs"
                    color={isEnded ? "red" : "teal"}
                >
                    {isEnded ? "Ended" : "Live"}
                </Badge>
            </Indicator>

            <Badge
                size="xs"
                leftSection={
                    <Text size={"8"} visibleFrom="sm">
                        Part
                    </Text>
                }
                rightSection={<IconSparkles size={14} />}
                color={getColorFromId(match.part)}
            >
                {match.part}
            </Badge>

            <Text size="xs">Colony: {colony}</Text>

            {match.winner ? (
                <Badge
                    variant="light"
                    size="xs"
                    color="indigo"
                    leftSection={<IconCrown size={15} />}
                >
                    <Text size="xs" truncate="end" maw={50}>
                        {match.winner.name}
                    </Text>
                </Badge>
            ) : null}

            <Code color={isEnded ? "red" : undefined}>
                {isEnded ? timeLeft : `ends in: ${timeLeft}`}
            </Code>

            {userInfo?.admin &&
                checkAdminPermission(userInfo.admin, "match", 4) && (
                    <DeleteMatchAction2 matchId={match.id} />
                )}
        </Group>
    );
}

type MatchStatusHeaderProp = {
    match: MatchInfo;
    isEnded: boolean;
    timeLeft: string;
};
