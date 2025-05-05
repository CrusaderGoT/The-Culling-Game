"use client";

import circleClasses from "@/styles/colony-circle.module.css";
import {
    ActionIcon,
    AspectRatio,
    BackgroundImage,
    Flex,
    Image as MantineImage,
    Overlay,
    Stack,
    Text,
    Title,
} from "@mantine/core";

import { useHover } from "@mantine/hooks";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function ColonyCircle() {
    const { hovered, ref } = useHover();

    const [scaled, setScaled] = useState(false);

    useEffect(() => {
        if (!hovered) {
            setScaled(false);
        }
    }, [hovered]);

    return (
        <Flex className={`${circleClasses.colonyContainer}`}>
            <AspectRatio
                ref={ref}
                ratio={1}
                h={{ base: 300, md: 400, lg: 500 }}
                w={{ base: 300, md: 400, lg: 500 }}
                className={`${circleClasses.colonyCircle}`}
            >
                <BackgroundImage
                    src="/images/skyline-4.jpg"
                    className={`${circleClasses.circleImage}`}
                    style={{
                        transform: scaled
                            ? "scale3d(2.5, 2.0, 2.3)"
                            : "scale3d(1, 1, 1)",
                    }}
                >
                    <Overlay className={`${circleClasses.circleOverlay}`} />
                </BackgroundImage>

                <CircleContent circleHovered={hovered} scaleImage={setScaled} />
            </AspectRatio>
        </Flex>
    );
}

type CircleContentProp = {
    circleHovered: boolean;
    scaleImage: Dispatch<SetStateAction<boolean>>;
};

function CircleContent({ circleHovered, scaleImage }: CircleContentProp) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    return (
        <Stack justify="center" align="center">
            <Title order={2} className={`${circleClasses.colonyText}`}>
                COLONY
            </Title>

            <Text className={`${circleClasses.colonyWarning}`}>
                {circleHovered
                    ? "a dangerous game known as the culling games is going on inside. where players kill each other in a battle royale. do you still wish to enter?"
                    : ""}
            </Text>

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
                    //router.push("/match");
                    //setLoading(true);
                    scaleImage((prev) => !prev);
                }}
            >
                <MantineImage
                    component={Image}
                    src={"/images/Kogane.png"}
                    alt="kogane.jpg"
                    width={325}
                    height={275}
                    className={`${circleClasses.enterBtnImage}`}
                    fallbackSrc={"/images/HiromiKogane.png"}
                />
            </ActionIcon>
        </Stack>
    );
}
