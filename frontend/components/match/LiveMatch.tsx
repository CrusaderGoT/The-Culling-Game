"use client";

import {
    Box,
    Button,
    Drawer,
    Flex,
    Group,
    Stack,
    Tabs,
    Text,
    Title,
} from "@mantine/core";

import {
    IconMessageCircle,
    IconPhoto,
    IconSettings,
} from "@tabler/icons-react";

import { useDisclosure } from "@mantine/hooks";

import { BarChart } from "@mantine/charts";
import { PlayerInfo } from "@/api/client";

export function LiveMatch() {
    return (
        <Flex
            direction={"column"}
            align={"center"}
            p={"md"}
            justify={"space-between"}
            gap={"xl"}
        >
            <Group>
                <Title order={2}>Emy</Title>
                <Text>vs</Text>
                <Title order={2}>Emeka</Title>
            </Group>

            <VotingChart />

            <VoteDrawer />
        </Flex>
    );
}

type VoteDrawerProp = {
    fighters: string[]; // to be passed to forms
};

function VoteDrawer() {
    const [opened, { open, close }] = useDisclosure();

    return (
        <Box>
            <Drawer
                opened={opened}
                onClose={close}
                title="Cast Your Vote"
                offset={10}
                radius={"md"}
                position="bottom"
                transitionProps={{
                    transition: "fade-up",
                    duration: 500,
                    timingFunction: "ease-in-out",
                }}
            >
                <VoteDrawerTabs />
            </Drawer>

            <Button onClick={open}>Vote</Button>
        </Box>
    );
}

function VotingChart() {
    return (
        <BarChart
            h={300}
            data={data}
            dataKey="month"
            type="percent"
            orientation="vertical"
            withLegend
            tickLine="xy"
            gridAxis="xy"
            series={[
                { name: "Demon Dogs", color: "violet.6" },
                { name: "Nue", color: "blue.6" },
                { name: "Orochi", color: "teal.6" },

                { name: "Hollow", color: "red.6" },
                { name: "Uzumaki", color: "cyan.6" },
                { name: "Swap", color: "yellow.6" },
            ]}
        />
    );
}

const data = [
    { month: "Emeka", "Demon Dogs": 1200, Nue: 500, Orochi: 800 },
    { month: "Emy", Hollow: 1900, Uzumaki: 1200, Swap: 400 },
];

function VoteDrawerTabs() {
    return (
        <Tabs defaultValue="Emy">
            <Tabs.List grow>
                <Tabs.Tab value="Emy" leftSection={<IconPhoto size={12} />} color="yellow">
                    Emy
                </Tabs.Tab>

                <Tabs.Tab
                    value="Emeka"
                    leftSection={<IconMessageCircle size={12} />}
                >
                    Emeka
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="Emeka">Some type of Form?</Tabs.Panel>

            <Tabs.Panel value="Emy">Player CT details and checkbox for ct apps</Tabs.Panel>
        </Tabs>
    );
}

type VoteFormProp = {
    player: PlayerInfo["cursed_technique"]
}

function VoteForm() {

}
