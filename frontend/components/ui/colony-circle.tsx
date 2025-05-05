"use client";

import circleClasses from "@/styles/colony-circle.module.css";
import {
    ActionIcon,
    AspectRatio,
    Avatar,
    BackgroundImage,
    Flex,
    Overlay,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import { useHover } from "@mantine/hooks";
import { IconDoorEnter } from "@tabler/icons-react";

import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function ColonyCircle() {
    const { hovered, ref } = useHover();

    const [scaleImage, setScaleImage] = useState(false);

    useEffect(() => {
        if (!hovered) {
            setScaleImage(false);
        }
    }, [hovered]);

    return (
        <Flex className={`${circleClasses.colonyContainer}`}>
            <AspectRatio
                ref={ref}
                ratio={1}
                h={{ base: 300, sm: 400, md: 500, lg: 600 }}
                w={{ base: 300, sm: 400, md: 500, lg: 600 }}
                className={`${circleClasses.colonyCircle}`}
            >
                <BackgroundImage
                    src="/images/skyline-4.jpg"
                    className={`${circleClasses.circleImage}`}
                    style={{
                        transform: scaleImage
                            ? "scale3d(2.5, 2.0, 2.3)"
                            : "scale3d(1, 1, 1)",
                    }}
                >
                    <Overlay className={`${circleClasses.circleOverlay}`} />
                </BackgroundImage>

                <CircleContent
                    circleHovered={hovered}
                    setScaleImage={setScaleImage}
                />
            </AspectRatio>
        </Flex>
    );
}

type CircleContentProp = {
    circleHovered: boolean;
    setScaleImage: Dispatch<SetStateAction<boolean>>;
};

function CircleContent({ circleHovered, setScaleImage }: CircleContentProp) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        router.prefetch("/match");
        if (!circleHovered) setLoading(false);
    }, [router, circleHovered, setLoading]);

    return (
        <Stack justify="center" align="center">
            <Title order={2} className={`${circleClasses.colonyText}`}>
                COLONY
            </Title>

            {circleHovered && (
                <Text className={`${circleClasses.colonyWarning}`}>
                    a dangerous game known as the culling games is going on
                    inside. where players kill each other in a battle royale. do
                    you still wish to enter?
                </Text>
            )}

            <ActionIcon
                variant="transparent"
                aria-label="Enter"
                color="deepred"
                size={"xl"}
                radius={"xl"}
                className={`${circleClasses.colonyEnterBtn}`}
                title={!loading ? "enter" : "making vows..."}
                loading={loading}
                onClick={() => {
                    setLoading(true);
                    setScaleImage((prev) => !prev);
                    router.push("/match");
                }}
            >
                <Avatar
                    variant="transparent"
                    color="deepred"
                    src={"/images/HiromiKogane.png"}
                    alt={"enter button"}
                >
                    <IconDoorEnter />
                </Avatar>
            </ActionIcon>
        </Stack>
    );
}
