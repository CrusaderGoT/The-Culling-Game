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
    IconDotsVertical,
    IconFish,
    IconFishOff,
    IconLogout,
    IconSettings,
    IconTrash,
    IconUserEdit,
} from "@tabler/icons-react";

import { forwardRef } from "react";

import { useAuth } from "@/lib/contexts/auth-provider";
import { deleteSession } from "@/lib/session";
import { useCurrentUser } from "@/lib/hooks/users";
import { getColorFromId } from "@/lib/utils";
import classes from "@/styles/user-menu.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserButtonProps extends React.ComponentPropsWithoutRef<"button"> {
    user: UserInfo;
}

const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>(
    ({ user, ...others }: UserButtonProps, ref) => (
        <UnstyledButton ref={ref} {...others}>
            <Group>
                <Avatar name={user.username} />
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

function UserButtonAlt() {
    return (
        <ActionIcon variant="transparent" className={classes.menuAlt}>
            <IconDotsVertical />
        </ActionIcon>
    );
}

export function UserMenu() {
    const theme = useMantineTheme();

    const router = useRouter();

    const { token } = useAuth();

    const { data: user, isPending } = useCurrentUser(token);

    if (isPending)
        return (
            <Box>
                <Skeleton height={38} width={220} className={classes.menu} />

                <Skeleton
                    height={28}
                    width={5}
                    mr={"sm"}
                    className={classes.menuAlt}
                />
            </Box>
        );

    if (!user) return <AnonMenu />;

    return (
        <Menu
            withArrow
            transitionProps={{ transition: "rotate-left", duration: 150 }}
        >
            <Menu.Target>
                <Group>
                    <UserButton user={user} className={classes.menu} />
                    <UserButtonAlt />
                </Group>
            </Menu.Target>

            <Menu.Dropdown>
                <Box className={classes.menuAlt}>
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

                <Menu.Item
                    leftSection={
                        <IconUserEdit
                            size={16}
                            stroke={1.5}
                            color={theme.colors.yellow[6]}
                        />
                    }
                >
                    Edit User
                </Menu.Item>

                <Menu.Item
                    leftSection={
                        <IconFish
                            size={16}
                            stroke={1.5}
                            color={
                                user.player
                                    ? theme.colors.blue[5]
                                    : theme.colors.green[7]
                            }
                        />
                    }
                    component={Link}
                    href="/player/form"
                >
                    {user.player ? "Edit Player" : "Create Player"}
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

                <Menu.Divider />
                <Menu.Label>Danger</Menu.Label>

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

                <Menu.Item
                    leftSection={
                        <IconFishOff
                            size={16}
                            stroke={1.5}
                            color={theme.colors.red[6]}
                        />
                    }
                    color="red"
                >
                    Delete Player
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
