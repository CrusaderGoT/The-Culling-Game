"use client";

import {
    ActionIcon,
    Group,
    MantineColor,
    TooltipFloating,
} from "@mantine/core";
import { Icon } from "@tabler/icons-react";

type BigActionIconProps = {
    onclick: () => void;
    icons: Icon[];
    iconSize?: number;
    height?: number;
    color?: MantineColor;
    label: string;
};

/**
 * Renders a large, customizable action button with one or more icons and a tooltip.
 *
 * @param props.onclick - Callback function to handle button click events.
 * @param props.label - The label to display in the tooltip when hovering over the button.
 * @param props.height - The height of the button in pixels. Defaults to 200.
 * @param props.color - The color of the button. Defaults to "gold".
 * @param props.icons - An array of icon components to display inside the button.
 * @param props.iconSize - The size of each icon in pixels. Defaults to 50.
 *
 * @returns A button component wrapped with a tooltip, displaying the provided icons and label.
 */
export function BigActionButton({
    onclick,
    label,
    height = 200,
    color = "gold",
    icons,
    iconSize = 50,
}: BigActionIconProps) {
    return (
        <TooltipFloating label={label}>
            <ActionIcon flex={1} h={height} onClick={onclick} color={color}>
                <Group gap={"md"} justify="center">
                    {icons.map((AIcon, index) => (
                        <AIcon key={index} size={iconSize} />
                    ))}
                </Group>
            </ActionIcon>
        </TooltipFloating>
    );
}
