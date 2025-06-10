"use client";

import {
    Avatar,
    Badge,
    Card,
    Container,
    Divider,
    Grid,
    Group,
    List,
    Paper,
    Progress,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconShield,
    IconStar,
    IconSword,
    IconTrophy,
} from "@tabler/icons-react";

const player = {
    name: "Alex Mercer",
    avatar: "https://avatars.githubusercontent.com/u/133652764?v=4",
    level: 27,
    rank: "Diamond",
    stats: {
        gamesPlayed: 120,
        wins: 78,
        kills: 340,
        deaths: 95,
        kdr: 3.58,
        winRate: 65,
        exp: 7800,
        expToNext: 10000,
    },
    achievements: [
        { icon: IconTrophy, label: "Top 1% Winner" },
        { icon: IconSword, label: "100+ Kills" },
        { icon: IconShield, label: "Unbreakable" },
        { icon: IconStar, label: "MVP 10x" },
    ],
};

export default function PlayerPage() {
    return (
        <Container size="md" py="xl">
            <Card shadow="md" radius="lg" withBorder p="xl">
                <Group align="center" gap="xl">
                    <Avatar src={player.avatar} size={120} radius="xl" />
                    <Stack gap={4}>
                        <Title order={2}>{player.name}</Title>
                        <Group>
                            <Badge color="blue" size="lg" radius="sm">
                                Level {player.level}
                            </Badge>
                            <Badge
                                color="grape"
                                size="lg"
                                radius="sm"
                                variant="gradient"
                                gradient={{ from: "grape", to: "violet" }}
                            >
                                {player.rank}
                            </Badge>
                        </Group>
                        <Text c="dimmed" size="sm">
                            Victory is reserved for those who are willing to pay
                            its price.
                        </Text>
                    </Stack>
                </Group>

                <Divider my="xl" />

                <Grid gutter="xl">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper withBorder radius="md" p="md">
                            <Title order={4} mb="sm">
                                Stats
                            </Title>
                            <List
                                spacing="xs"
                                size="sm"
                                icon={
                                    <ThemeIcon
                                        color="blue"
                                        size={20}
                                        radius="xl"
                                    >
                                        <IconSword size={14} />
                                    </ThemeIcon>
                                }
                            >
                                <List.Item>
                                    Games Played:{" "}
                                    <b>{player.stats.gamesPlayed}</b>
                                </List.Item>
                                <List.Item>
                                    Wins: <b>{player.stats.wins}</b>
                                </List.Item>
                                <List.Item>
                                    Kills: <b>{player.stats.kills}</b>
                                </List.Item>
                                <List.Item>
                                    Deaths: <b>{player.stats.deaths}</b>
                                </List.Item>
                                <List.Item>
                                    K/D Ratio: <b>{player.stats.kdr}</b>
                                </List.Item>
                                <List.Item>
                                    Win Rate: <b>{player.stats.winRate}%</b>
                                </List.Item>
                            </List>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper withBorder radius="md" p="md">
                            <Title order={4} mb="sm">
                                Experience
                            </Title>
                            <Text size="sm" mb={4}>
                                {player.stats.exp} / {player.stats.expToNext} XP
                            </Text>
                            <Progress
                                value={
                                    (player.stats.exp /
                                        player.stats.expToNext) *
                                    100
                                }
                                color="violet"
                                radius="xl"
                                size="lg"
                            />
                        </Paper>
                    </Grid.Col>
                </Grid>

                <Divider my="xl" />

                <Title order={4} mb="md">
                    Achievements
                </Title>
                <Group gap="md">
                    {player.achievements.map((ach, idx) => (
                        <Badge
                            key={idx}
                            leftSection={<ach.icon size={18} />}
                            color="teal"
                            size="lg"
                            variant="light"
                            radius="sm"
                        >
                            {ach.label}
                        </Badge>
                    ))}
                </Group>
            </Card>
        </Container>
    );
}
