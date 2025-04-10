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

import { PlayerInfo, type CastVote } from "@/api/client";
import { useDisclosure } from "@mantine/hooks";
import {
    IconArrowDown,
    IconArrowUp,
    IconAward,
    IconChartArcs,
    IconVs,
} from "@tabler/icons-react";
import { useState } from "react";
import { VoteCards, VoteForm } from "./forms/vote-form";

export const playerInfo: PlayerInfo = {
    id: 1,
    cursed_technique: {
        name: "my ct",
        id: 2,
        definition: "my ct definition",
        applications: [
            {
                name: "ct app",
                id: 4,
                number: 5,
                application: "my ct app application",
            },
            {
                name: "ct app",
                id: 5,
                number: 5,
                application: "my ct app application",
            },
            {
                name: "ct app",
                id: 3,
                number: 5,
                application: "my ct app application",
            },
        ],
    },
    age: 60,
    name: "my name",
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

    const [value, setValue] = useState<string[]>([]);

    const votes: CastVote[] = value.map((appId) => ({
        player_id: 1,
        ct_app_id: Number(appId),
    }));

    return (
        <Box>
            <Drawer
                offset={8}
                radius="md"
                opened={opened}
                onClose={close}
                title="Cast Your Votes"
                returnFocus
                position="bottom"
            >
                <VoteCards
                    value={value}
                    setValue={setValue}
                    player={playerInfo}
                />{" "}
                #tab 1
                <VoteForm votes={votes} /> #tab 2{`${JSON.stringify(votes)}`}
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
