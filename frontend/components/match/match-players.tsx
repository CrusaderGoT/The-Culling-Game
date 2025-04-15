import {
    Avatar,
    Badge,
    Flex,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";

import {
    IconArrowDown,
    IconArrowUp,
    IconAward,
    IconChartArcs,
    IconVs,
} from "@tabler/icons-react";

export function MatchPlayers() {
    return (
        <Flex
            justify="space-between"
            gap={"xs"}
            direction={{ base: "column", md: "row" }}
        >
            <Paper flex={1} withBorder>
                <Group justify="space-between" p={5}>
                    <ThemeIcon color="grape" size={"xs"} radius={"lg"}>
                        <IconAward size={14} />
                    </ThemeIcon>

                    <Badge
                        size="xs"
                        leftSection={<IconChartArcs size={14} />}
                        rightSection={<IconArrowDown size={14} />}
                    >
                        120
                    </Badge>
                </Group>

                <Stack p={"xs"} align="center">
                    <Avatar size={"lg"} name="Ethan" />
                    <Text>Ethan</Text>
                    <Badge>Grade 1</Badge>
                </Stack>
            </Paper>

            <ThemeIcon
                color="red"
                size={"lg"}
                variant="light"
                radius="lg"
                style={{
                    alignSelf: "center",
                }}
            >
                <IconVs size={18} />
            </ThemeIcon>

            <Paper flex={1}>
                <Group justify="space-between" p={5}>
                    <Badge
                        size="xs"
                        leftSection={<IconChartArcs size={14} />}
                        rightSection={<IconArrowUp size={14} />}
                    >
                        120
                    </Badge>
                </Group>
                <Stack p={"md"} align="center">
                    <Avatar size={"lg"} name="Nahte" />
                    <Text>Nahte</Text>
                    <Badge>Grade 1</Badge>
                </Stack>
            </Paper>
        </Flex>
    );
}
