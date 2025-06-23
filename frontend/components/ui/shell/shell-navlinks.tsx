"use client";

import { NavLink, Stack } from "@mantine/core";
import { Icon, Icon123 } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkDataType = {
    href: string;
    leftSection: Icon;
    rightIcon?: Icon;
    label: string;
    description?: string;
}[];

const navLinkData: NavLinkDataType = [
    {
        href: "/admin/dashboard",
        label: "dashboard",
        leftSection: Icon123,
        description: "main admin interface",
    },
    {
        href: "/admin/match",
        label: "matches",
        leftSection: Icon123,
        description: "match interface",
    },
    {
        href: "/admin/player",
        label: "players",
        leftSection: Icon123,
    },
];

type ShellNavLinksProp = {
    closeNavbar: () => void;
};
export function ShellNavLinks({ closeNavbar }: ShellNavLinksProp) {
    const pathname = usePathname();

    return (
        <Stack justify="space-evenly">
            {navLinkData.map((link, index) => {
                const NavIcon = link.leftSection;

                return (
                    <NavLink
                        key={`${link.href}-${index}`}
                        component={Link}
                        href={link.href}
                        label={link.label}
                        description={link.description}
                        leftSection={<NavIcon size={20} stroke={1.5} />}
                        active={pathname === link.href}
                        autoContrast
                        onClick={closeNavbar}
                    />
                );
            })}
        </Stack>
    );
}
