import { UserInfo } from "@/api/client";
import {
    Avatar,
    Box,
    Group,
    Menu,
    Text,
    UnstyledButton,
    useMantineTheme,
} from "@mantine/core";
import {
    IconChevronRight,
    IconHeart,
    IconLogout,
    IconMessage,
    IconPlayerPause,
    IconSettings,
    IconStar,
    IconSwitchHorizontal,
    IconTrash,
} from "@tabler/icons-react";
import { forwardRef } from "react";
interface UserButtonProps extends React.ComponentPropsWithoutRef<"button"> {
    user: UserInfo;
    icon?: React.ReactNode;
}

const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>(
    ({ user, icon, ...others }: UserButtonProps, ref) => (
        <UnstyledButton
            ref={ref}
            style={{
                padding: "var(--mantine-spacing-md)",
                color: "var(--mantine-color-text)",
                borderRadius: "var(--mantine-radius-sm)",
            }}
            {...others}
        >
            <Group>
                <Avatar src={user.username} radius="xl" />
                <Box flex={1}>
                    <Text size="sm" fw={500}>
                        {user.username}
                    </Text>

                    <Text c="dimmed" size="xs">
                        {user.email}
                    </Text>
                </Box>

                {icon || <IconChevronRight size={16} />}
            </Group>
        </UnstyledButton>
    )
);

UserButton.displayName = "UserButton";

export function UserMenu({ user }: { user: UserInfo }) {
    const theme = useMantineTheme();
    return (
        <Menu withArrow>
            <Menu.Target>
                <UserButton user={user} />
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item
                    rightSection={<IconChevronRight size={16} stroke={1.5} />}
                >
                    <Group>
                        <Avatar
                            radius="xl"
                            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-7.png"
                        />

                        <div>
                            <Text fw={500}>Nancy Eggshacker</Text>
                            <Text size="xs" c="dimmed">
                                neggshaker@mantine.dev
                            </Text>
                        </div>
                    </Group>
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                    leftSection={
                        <IconHeart
                            size={16}
                            stroke={1.5}
                            color={theme.colors.red[6]}
                        />
                    }
                >
                    Liked posts
                </Menu.Item>
                <Menu.Item
                    leftSection={
                        <IconStar
                            size={16}
                            stroke={1.5}
                            color={theme.colors.yellow[6]}
                        />
                    }
                >
                    Saved posts
                </Menu.Item>
                <Menu.Item
                    leftSection={
                        <IconMessage
                            size={16}
                            stroke={1.5}
                            color={theme.colors.blue[6]}
                        />
                    }
                >
                    Your comments
                </Menu.Item>

                <Menu.Label>Settings</Menu.Label>
                <Menu.Item
                    leftSection={<IconSettings size={16} stroke={1.5} />}
                >
                    Account settings
                </Menu.Item>
                <Menu.Item
                    leftSection={
                        <IconSwitchHorizontal size={16} stroke={1.5} />
                    }
                >
                    Change account
                </Menu.Item>
                <Menu.Item leftSection={<IconLogout size={16} stroke={1.5} />}>
                    Logout
                </Menu.Item>

                <Menu.Divider />

                <Menu.Label>Danger zone</Menu.Label>
                <Menu.Item
                    leftSection={<IconPlayerPause size={16} stroke={1.5} />}
                >
                    Pause subscription
                </Menu.Item>
                <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={16} stroke={1.5} />}
                >
                    Delete account
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
