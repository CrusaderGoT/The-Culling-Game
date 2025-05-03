"use client";

import {
    CreatePlayerFormProvider,
    PlayerInputs,
    createPlayerSchema,
    useCreatePlayerForm,
} from "@/components/player/forms/create-player-form-context";
import { Button, Group, Paper, Stepper } from "@mantine/core";
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
        const isOutOfBounds = nextStep > 3 || nextStep < 0;

        if (isOutOfBounds) {
            return;
        }

        // validate current section before moving to next step
        const key = fieldKeys[active] as string;
        form.validateField(key);
        const errors = form.errors;
        console.log(errors, key, !(key in errors));
        if (!(key in errors)) {
            setActive(nextStep);
            setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
        }
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
                            <PlayerInputs />
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
                            Step 2 content: Verify email
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
                            <PlayerInputs />
                        </Stepper.Step>

                        <Stepper.Completed>
                            Completed, click back button to get to previous step
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

                        <Button
                            onClick={() => handleStepChange(active + 1)}
                        >
                            Next step
                        </Button>
                    </Group>
                </form>
            </CreatePlayerFormProvider>
        </Paper>
    );
}
