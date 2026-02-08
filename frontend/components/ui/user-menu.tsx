"use client";

import { UserInfo } from "@/api/client";

import {
    ActionIcon,
    Anchor,
    Avatar,
    Box,
    Divider,
    Group,
    Indicator,
    Menu,
    Skeleton,
    Text,
    UnstyledButton,
    useMantineTheme,
} from "@mantine/core";

import {
    IconDashboard,
    IconFish,
    IconLogout,
    IconSettings,
    IconTrash,
    IconUser,
    IconUserCog,
} from "@tabler/icons-react";

import { forwardRef } from "react";

import { useAuth } from "@/lib/contexts/auth-context-provider";
import { deleteSession } from "@/lib/session";
import { getColorFromId } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserButtonProps extends React.ComponentPropsWithoutRef<"button"> {
    user: UserInfo;
}

const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>(
    ({ user, ...others }: UserButtonProps, ref) => (
        <UnstyledButton ref={ref} {...others} visibleFrom="sm">
            <Group>
                <Avatar
                    name={user.username}
                    size={30}
                    src={user.player?.picture}
                />
                <Box flex={1}>
                    <Group>
                        <Text size="sm" fw={500}>
                            {user.username}
                        </Text>
                        {user?.player && (
                            <Indicator color={getColorFromId(user.player.id)} />
                        )}
                    </Group>

                    <Text c="dimmed" size="xs">
                        {user.email}{" "}
                        {user?.country ? `• ${user.country}` : null}
                    </Text>
                </Box>
            </Group>
        </UnstyledButton>
    )
);

UserButton.displayName = "UserButton";

function UserButtonAlt({ user }: { user: UserInfo }) {
    return (
        <ActionIcon variant="light" hiddenFrom="sm" radius={"lg"}>
            <Avatar src={user.player?.picture}>
                <IconUserCog color="gold" />
            </Avatar>
        </ActionIcon>
    );
}

export function UserMenu() {
    const theme = useMantineTheme();

    const router = useRouter();

    const { user } = useAuth();

    if (!user)
        return (
            <Box>
                <Skeleton height={38} width={220} visibleFrom="sm" />

                <Skeleton height={28} width={5} circle hiddenFrom="sm" />
            </Box>
        );

    //if (!user) return <AnonMenu />;

    return (
        <Menu
            trigger="click-hover"
            withArrow
            transitionProps={{ transition: "rotate-left", duration: 150 }}
            offset={25}
        >
            <Menu.Target>
                <Group>
                    <UserButtonAlt user={user} />

                    <UserButton user={user} />
                </Group>
            </Menu.Target>

            <Menu.Dropdown>
                <Box hiddenFrom="sm">
                    <Group justify="center" m={"xs"}>
                        <Text size="xs">{user.username}</Text>
                        {user?.player && (
                            <Indicator
                                size={7}
                                color={getColorFromId(user.player.id)}
                            />
                        )}
                    </Group>

                    <Menu.Divider />
                </Box>

                {user.admin && (
                    <Menu.Item
                        leftSection={<IconDashboard size={16} stroke={1.5} />}
                        component={Link}
                        href="/admin"
                    >
                        Admin Dashboard
                    </Menu.Item>
                )}

                <Menu.Sub>
                    <Menu.Sub.Target>
                        <Menu.Sub.Item
                            leftSection={
                                <IconUser
                                    size={16}
                                    stroke={1.5}
                                    color={getColorFromId(user.id)}
                                />
                            }
                        >
                            User
                        </Menu.Sub.Item>
                    </Menu.Sub.Target>

                    <Menu.Sub.Dropdown>
                        <Menu.Item>Edit User</Menu.Item>

                        <Menu.Item
                            leftSection={
                                <IconTrash
                                    size={16}
                                    stroke={1.5}
                                    color={theme.colors.red[6]}
                                />
                            }
                            color="red"
                        >
                            Delete User
                        </Menu.Item>
                    </Menu.Sub.Dropdown>
                </Menu.Sub>

                <Menu.Item
                    leftSection={
                        <IconFish
                            size={16}
                            stroke={1.5}
                            color={
                                user.player
                                    ? getColorFromId(user.player.id)
                                    : theme.colors.green[7]
                            }
                        />
                    }
                    component={Link}
                    href="/player"
                >
                    {user.player ? "Player Profile" : "Create Player"}
                </Menu.Item>

                <Menu.Label>Settings</Menu.Label>
                <Menu.Item
                    leftSection={<IconSettings size={16} stroke={1.5} />}
                >
                    Settings
                </Menu.Item>

                <Menu.Item
                    leftSection={<IconLogout size={16} stroke={1.5} />}
                    onClick={async () => {
                        await deleteSession();
                        router.push("/");
                    }}
                >
                    Logout
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}

function AnonMenu() {
    return (
        <Group>
            <Anchor component={Link} href={"/login"}>
                Login
            </Anchor>
            <Divider label="or" orientation="horizontal" />
            <Anchor component={Link} href={"/signup"}>
                Create User
            </Anchor>
        </Group>
    );
}
