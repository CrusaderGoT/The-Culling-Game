import { MatchInfo } from "@/api/client";
import { Badge, Code, Group, Indicator } from "@mantine/core";

export function MatchStatusHeader({ match }: MatchStatusHeaderProp) {
    const timer = `ending ${match.end}`;
    const colony = `${match.colony.id} - ${match.colony.country}`;

    return (
        <Group align="center" justify="space-between">
            <Indicator
                position="middle-start"
                size={12}
                color={"green"}
                processing
                withBorder
            >
                <Badge
                    variant="light"
                    size="md"
                    color="teal"
                    rightSection={colony}
                >
                    Live
                </Badge>
            </Indicator>

            <Code>{timer}</Code>
        </Group>
    );
}

type MatchStatusHeaderProp = {
    match: MatchInfo;
};
