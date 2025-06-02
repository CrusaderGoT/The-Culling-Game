import { MatchInfo } from "@/api/client";
import { Badge, Code, Group, Indicator, Text } from "@mantine/core";
import { IconCrown } from "@tabler/icons-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";

// Extend dayjs with plugins
dayjs.extend(duration);
dayjs.extend(relativeTime);

export function MatchHeader({ match }: MatchStatusHeaderProp) {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isEnded, setIsEnded] = useState<boolean>(false);

    useEffect(() => {
        const updateTimer = () => {
            const now = dayjs();
            const endTime = dayjs(match.end);

            if (now.isAfter(endTime) || now.isSame(endTime)) {
                setIsEnded(true);
                setTimeLeft(`ended ${endTime.fromNow()}`);
                return;
            }

            const diff = endTime.diff(now);
            const duration = dayjs.duration(diff);

            const days = Math.floor(duration.asDays());
            const hours = duration.hours();
            const minutes = duration.minutes();
            const seconds = duration.seconds();

            let timeString = "";

            if (days > 0) {
                timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else if (hours > 0) {
                timeString = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                timeString = `${minutes}m ${seconds}s`;
            } else {
                timeString = `${seconds}s`;
            }

            setTimeLeft(timeString);
        };

        // Initial update
        updateTimer();

        // Set up interval to update every second
        const interval = setInterval(updateTimer, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [match.end]);

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
        </Group>
    );
}

type MatchStatusHeaderProp = {
    match: MatchInfo;
};
