"use client";

import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    CardSection,
    Code,
    Drawer,
    Flex,
    Group,
    Indicator,
    Paper,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";

import { BarChart } from "@mantine/charts";

import { useDisclosure } from "@mantine/hooks";
import {
    IconArrowDown,
    IconArrowUp,
    IconAward,
    IconChartArcs,
    IconVs,
} from "@tabler/icons-react";

function MatchHeader() {
    const timer = "20 secs left";
    const colony = "1 - AD";

    return (
        <Group align="center" justify="space-between">
            <Indicator position="middle-start" size={12} processing withBorder>
                <Badge variant="light" size="md" rightSection={colony}>
                    Live
                </Badge>
            </Indicator>

            <Code>{timer}</Code>
        </Group>
    );
}

function MatchPlayers() {
    return (
        <Flex
            justify="space-between"
            gap={"xs"}
            direction={{ base: "column", md: "row" }}
        >
            <Paper flex={1}>
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
                    <Avatar size={"lg"} name="Ethan" />
                    <Text>Nahte</Text>
                    <Badge>Grade 1</Badge>
                </Stack>
            </Paper>
        </Flex>
    );
}

function MatchVoteChart() {
    const data = [
        { player: "Ethan", Smartphones: 1200, Laptops: 900, Tablets: 700 },
        { player: "Nahte", Dullphones: 1500, Mobile: 1200, Pills: 400 },
    ];

    return (
        <BarChart
            type="stacked"
            orientation="vertical"
            h={300}
            data={data}
            dataKey="player"
            series={[
                { name: "Smartphones", color: "violet.6" },
                { name: "Laptops", color: "blue.6" },
                { name: "Tablets", color: "teal.6" },

                { name: "Dullphones", color: "pink.6" },
                { name: "Mobile", color: "black" },
                { name: "Pills", color: "white" },
            ]}
            withLegend
            legendProps={{ verticalAlign: "bottom" }}
            tickLine="x"
            gridAxis="y"
            xAxisLabel="Points"
            tooltipAnimationDuration={200}
            withBarValueLabel
            barChartProps={{ maxBarSize: 50 }}
        />
    );
}

function VoteTab() {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <Box>
            <Drawer
                offset={8}
                radius="md"
                opened={opened}
                onClose={close}
                title="Authentication"
            >
                {/* Drawer content */}
            </Drawer>

            <Button variant="filled" onClick={open}>
                Vote
            </Button>
        </Box>
    );
}

export function LiveMatch() {
    return (
        <Card padding={"xs"}>
            <CardSection p={"xs"}>
                <MatchHeader />
            </CardSection>

            <MatchPlayers />

            <CardSection p={"xs"} pr={"xl"}>
                <MatchVoteChart />
            </CardSection>

            <CardSection mx={"auto"} p={"xs"}>
                <VoteTab />
            </CardSection>
            
        </Card>
    );
}
