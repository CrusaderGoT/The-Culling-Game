"use client";

import {
    Avatar,
    Badge,
    Card,
    CardSection,
    Code,
    Flex,
    Group,
    Indicator,
    Paper,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";

import { BarChart } from "@mantine/charts";

import { PlayerInfo } from "@/api/client";
import {
    IconArrowDown,
    IconArrowUp,
    IconAward,
    IconChartArcs,
    IconVs,
} from "@tabler/icons-react";
import { VoteDrawer } from "../vote/vote-drawer";

export const playerInfo: PlayerInfo = {
    id: 1,
    cursed_technique: {
        name: "my ct",
        id: 2,
        definition: "my ct definition",
        applications: [
            {
                name: "Domain Expansion",
                id: 4,
                number: 1,
                application:
                    "Creates a guaranteed-hit barrier space where technique is amplified",
            },
            {
                name: "Simple Domain",
                id: 5,
                number: 2,
                application:
                    "Creates a small barrier that neutralizes Domain Expansion effects",
            },
            {
                name: "Cursed Energy Reinforcement",
                id: 3,
                number: 3,
                application:
                    "Enhances physical capabilities using cursed energy",
            },
            {
                name: "Black Flash",
                id: 6,
                number: 4,
                application:
                    "Distorts space-time with perfect timing to multiply damage by 2.5",
            },
            {
                name: "Reversed Cursed Technique",
                id: 7,
                number: 5,
                application:
                    "Combines positive and negative energy to heal injuries",
            },
        ],
    },
    age: 60,
    name: "Ethan",
    gender: "male",
    created: new Date().toDateString(),
    grade: 4,
    points: 4.0,
    matches: [],
    user: {
        username: "my username",
        id: 50,
        email: "e@gmail.com",
        created: new Date().toDateString(),
    },
    barrier_technique: null,
    colony: {
        id: 10,
        country: "AD",
    },
};

export const playerInfo2: PlayerInfo = {
    id: 2,
    cursed_technique: {
        name: "void technique",
        id: 3,
        definition: "manipulates empty space",
        applications: [
            {
                name: "Teleport",
                id: 6,
                number: 3,
                application: "instant movement through void",
            },
            {
                name: "Void Pocket",
                id: 7,
                number: 4,
                application: "store items in pocket dimension",
            },
            {
                name: "Hollow Purple",
                id: 8,
                number: 1,
                application:
                    "Combines opposing forces to create destructive void energy",
            },
            {
                name: "Maximum Technique",
                id: 9,
                number: 2,
                application:
                    "Unleashes the technique's full potential at the cost of more cursed energy",
            },
            {
                name: "Binding Vow",
                id: 10,
                number: 3,
                application: "Creates restrictions to gain power boosts",
            },
        ],
    },
    age: 25,
    name: "Nahte",
    gender: "female",
    created: new Date().toDateString(),
    grade: 1,
    points: 8.5,
    matches: [],
    user: {
        username: "void_walker",
        id: 51,
        email: "void@example.com",
        created: new Date().toDateString(),
    },
    barrier_technique: null,
    colony: {
        id: 11,
        country: "JP",
    },
};

function MatchHeader() {
    const timer = "20 secs left";
    const colony = "1 - AD";

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
                    <Avatar size={"lg"} name="Nahte" />
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
                { name: "Pills", color: "gray.6" },
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
                <VoteDrawer players={[playerInfo, playerInfo2]} />
            </CardSection>
        </Card>
    );
}
