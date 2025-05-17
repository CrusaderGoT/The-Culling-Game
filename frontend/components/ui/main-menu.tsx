"use client";

import { UserInfo } from "@/api/client";
import { Menu } from "@mantine/core";

import { IconDotsVertical } from "@tabler/icons-react";

export function UserMenu({ user }: { user: UserInfo }) {
    return (
        <Menu>
            <Menu.Target>
                <IconDotsVertical />
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>Hello, {user.username}</Menu.Label>
                
            </Menu.Dropdown>
        </Menu>
    );
}
