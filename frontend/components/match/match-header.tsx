"use client";

import { MatchInfo } from "@/api/client";
import { AssignMatchWinnerAction } from "@/components/admin/match/assign-match-winner";
import { DeleteMatchAction } from "@/components/admin/match/delete-match";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { checkAdminPermission, getColorFromId } from "@/lib/utils";
import {
    Avatar,
    Badge,
    Box,
    Code,
    Divider,
    Group,
    Indicator,
    Text,
} from "@mantine/core";
import { IconCrown, IconSparkles } from "@tabler/icons-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs with plugins
dayjs.extend(duration);
dayjs.extend(relativeTime);

export function MatchHeader({
    match,
    isEnded,
    timeLeft,
}: MatchStatusHeaderProp) {
    const { user } = useAuth();

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

            <Box ta={"center"}>
                <Text size="xs">{`No. ${match.id}`}</Text>
                <Divider />
                <Text size="xs">Colony: {colony}</Text>
            </Box>

            {match.winner ? (
                <Badge
                    variant="dot"
                    size="xs"
                    color={getColorFromId(match.winner.id)}
                    leftSection={<IconCrown size={14} />}
                    rightSection={
                        <Avatar
                            src={match.winner.picture}
                            name={match.winner.name}
                        />
                    }
                >
                    <Text size="xs" truncate="end" maw={100}>
                        {match.winner.name}
                    </Text>
                </Badge>
            ) : match.draw ? (
                <Text size="xs">Draw</Text>
            ) : null}

            <Code color={isEnded ? "red" : undefined}>
                {isEnded ? timeLeft : `ends in: ${timeLeft}`}
            </Code>

            {user?.admin && checkAdminPermission(user.admin, "match", [4]) && (
                <DeleteMatchAction small />
            )}

            {user?.admin &&
                checkAdminPermission(user.admin, "match", [2, 3]) && (
                    <AssignMatchWinnerAction small />
                )}
        </Group>
    );
}

type MatchStatusHeaderProp = {
    match: MatchInfo;
    isEnded: boolean;
    timeLeft: string;
};
