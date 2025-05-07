"use client";

import {
    ApplicationsInputs,
    CTAPPInfoList,
    CTInfoList,
    CreatePlayerFormProvider,
    CursedTechniqueInputs,
    PlayerInfoList,
    PlayerInputs,
    createPlayerSchema,
    useCreatePlayerForm,
} from "@/components/player/forms/create-player-form-context";

import {
    Box,
    Button,
    Grid,
    Group,
    Paper,
    ScrollAreaAutosize,
    Stepper,
} from "@mantine/core";

import {
    IconBuildingCarousel,
    IconCircleCheck,
    IconExclamationCircle,
    IconFishBoneFilled,
    IconYinYangFilled,
} from "@tabler/icons-react";

import { zodResolver } from "mantine-form-zod-resolver";

import { useState } from "react";

export function CreatePlayerForm() {
    const fieldKeys = [
        "player", // step 0
        "cursed_technique", // step 1
        "applications", // step 2
    ];

    const [active, setActive] = useState(0);
    const [highestStepVisited, setHighestStepVisited] = useState(active);

    const handleStepChange = (nextStep: number) => {
        const isOutOfBounds = nextStep > fieldKeys.length || nextStep < 0;

        if (isOutOfBounds) {
            return;
        }

        // validate current section before moving to next step
        const key = fieldKeys[active] as string;
        form.validateField(key);

        setActive(nextStep);
        setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
    };

    // Allow the user to freely go back and forth between visited steps.
    const shouldAllowSelectStep = (step: number) =>
        highestStepVisited >= step && active !== step;

    const form = useCreatePlayerForm({
        initialValues: {
            player: {
                name: "",
                role: "",
                age: 0,
                gender: "male",
            },
            cursed_technique: {
                name: "",
                definition: "",
            },
            applications: [
                { name: "", application: "" },
                { name: "", application: "" },
                { name: "", application: "" },
                { name: "", application: "" },
                { name: "", application: "" },
            ],
        },
        initialErrors: { player: "must be completed" },
        mode: "uncontrolled",
        validate: zodResolver(createPlayerSchema),
        validateInputOnBlur: true,
    });

    return (
        <Paper radius="md" p="md" withBorder mih={400}>
            <CreatePlayerFormProvider form={form}>
                <form>
                    <Stepper
                        size="sm"
                        active={active}
                        onStepClick={setActive}
                        color="grape"
                    >
                        <Stepper.Step
                            label="Player Info"
                            description="Define your Player"
                            icon={<IconFishBoneFilled />}
                            completedIcon={
                                form.errors.player ? (
                                    <IconExclamationCircle color="red" />
                                ) : (
                                    <IconCircleCheck />
                                )
                            }
                            allowStepSelect={shouldAllowSelectStep(0)}
                        >
                            <ScrollAreaAutosize mah={300}>
                                <PlayerInputs />
                            </ScrollAreaAutosize>
                        </Stepper.Step>

                        <Stepper.Step
                            label="Cursed Technique"
                            description="Explain your Technique"
                            icon={<IconYinYangFilled />}
                            completedIcon={
                                form.errors.cursed_technique ? (
                                    <IconExclamationCircle color="red" />
                                ) : (
                                    <IconCircleCheck />
                                )
                            }
                            allowStepSelect={shouldAllowSelectStep(1)}
                        >
                            <ScrollAreaAutosize mah={300}>
                                <CursedTechniqueInputs />
                            </ScrollAreaAutosize>
                        </Stepper.Step>

                        <Stepper.Step
                            label="Applications"
                            description="How do you use your Powers"
                            icon={<IconBuildingCarousel />}
                            completedIcon={
                                form.errors.applications ? (
                                    <IconExclamationCircle color="red" />
                                ) : (
                                    <IconCircleCheck />
                                )
                            }
                            allowStepSelect={shouldAllowSelectStep(2)}
                        >
                            <ScrollAreaAutosize mah={300}>
                                <ApplicationsInputs />
                            </ScrollAreaAutosize>
                        </Stepper.Step>

                        <Stepper.Completed>
                            {Object.keys(form.errors).length > 0 ? (
                                <div>
                                    <p>
                                        Some fields have errors. Please review
                                        your inputs:
                                    </p>
                                    <ul>
                                        {Object.entries(form.errors).map(
                                            ([field, error]) => (
                                                <li key={field}>
                                                    {field}: {error}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            ) : (
                                <Box>
                                    <Grid
                                        gutter={{
                                            base: "sm",
                                            xs: "md",
                                            md: "lg",
                                            xl: "xl",
                                        }}
                                        grow
                                    >
                                        <Grid.Col
                                            span={"content"}
                                            aria-disabled
                                        >
                                            <PlayerInfoList />
                                        </Grid.Col>
                                        <Grid.Col span={"content"}>
                                            <CTInfoList />
                                        </Grid.Col>
                                        <Grid.Col span={"content"}>
                                            <CTAPPInfoList />
                                        </Grid.Col>
                                    </Grid>
                                </Box>
                            )}
                        </Stepper.Completed>
                    </Stepper>

                    <Group justify="center" mt="xl">
                        {active > 0 && (
                            <Button
                                variant="default"
                                onClick={() => handleStepChange(active - 1)}
                            >
                                Back
                            </Button>
                        )}

                        {active < fieldKeys.length && (
                            <Button
                                onClick={() => handleStepChange(active + 1)}
                            >
                                Next
                            </Button>
                        )}
                    </Group>
                </form>
            </CreatePlayerFormProvider>
        </Paper>
    );
}
