"use client";

import {
    ApplicationFormList,
    ApplicationsFormInputs,
    CreatePlayerFormProvider,
    createPlayerSchema,
    CreatePlayerSchemaType,
    CursedTechniqueFormInputs,
    CursedTechniqueFormList,
    PlayerFormInputs,
    PlayerInfoFormList,
    useCreatePlayerForm,
} from "@/components/player/forms/create-player-form-context";
import { DisplayAPIError } from "@/components/ui/display-api-error";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useCreatePlayer } from "@/lib/hooks/players";

import {
    Button,
    Center,
    Divider,
    Group,
    LoadingOverlay,
    Paper,
    ScrollAreaAutosize,
    Stack,
    Stepper,
    Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import {
    IconBuildingCarousel,
    IconCircleCheck,
    IconExclamationCircle,
    IconFishBoneFilled,
    IconYinYangFilled,
} from "@tabler/icons-react";

import { zodResolver } from "mantine-form-zod-resolver";
import { useRouter } from "next/navigation";

import { useState } from "react";

import gstyles from "@/styles/global.module.css";
import clsx from "clsx";

export function CreatePlayerForm() {
    const router = useRouter();

    // Constants
    const FIELD_KEYS = [
        "player", // step 0
        "cursed_technique", // step 1
        "applications", // step 2
    ] as const;

    const INITIAL_APPLICATIONS = Array.from({ length: 5 }, () => ({
        name: "",
        application: "",
    }));

    const { token, user } = useAuth();

    const [active, setActive] = useState(0);
    const [highestStepVisited, setHighestStepVisited] = useState(active);

    const handleStepChange = (nextStep: number) => {
        const isOutOfBounds = nextStep > FIELD_KEYS.length || nextStep < 0;
        if (isOutOfBounds) return;

        // Validate current section before moving forward
        if (nextStep > active) {
            const currentFieldKey = FIELD_KEYS[active] as
                | "player"
                | "cursed_technique"
                | "applications";
            const validationResult = form.validateField(currentFieldKey);

            // Prevent navigation if current step has validation errors
            if (validationResult.hasError) {
                notifications.show({
                    message: `Please fix errors in ${currentFieldKey.replace(
                        "_",
                        " "
                    )} section`,
                    color: "orange",
                });
                return;
            }
        }

        setActive(nextStep);
        setHighestStepVisited((prev) => Math.max(prev, nextStep));
    };

    // Allow the user to freely go back and forth between visited steps.
    const shouldAllowSelectStep = (step: number) =>
        highestStepVisited >= step && active !== step;

    const form = useCreatePlayerForm({
        initialValues: {
            player: {
                name: "",
                role: "",
                age: 18,
                gender: "non-binary",
            },
            cursed_technique: {
                name: "",
                definition: "",
            },
            applications: INITIAL_APPLICATIONS,
        },
        initialErrors: { player: "must be completed" },
        mode: "uncontrolled",
        validate: zodResolver(createPlayerSchema),
        validateInputOnBlur: true,
    });

    const {
        isPending: createPlayerIsPending,
        isSuccess: createPlayerIsSuccess,
        mutateAsync: createPlayerMutate,
        error: createPlayerError,
        reset: createPlayerReset,
    } = useCreatePlayer(token);

    async function handleSubmit(data: CreatePlayerSchemaType) {
        if (!user) {
            notifications.show({
                message:
                    "User information not available. Please refresh and try again.",
                color: "red",
            });
            return;
        }

        const newPlayer = await createPlayerMutate({
            // @ts-ignore: applications are always 5
            body: data,
            path: { user: user.id },
        });

        `if (!newPlayer) {
            createPlayerReset();
            return;
        } else {
            router.refresh();
        }`;
    }

    return (
        <Paper radius="md" p="md" withBorder>
            <LoadingOverlay
                visible={createPlayerIsPending}
                zIndex={600}
                overlayProps={{ radius: "sm", blur: 0 }}
                loaderProps={{ type: "bars" }}
            />
            <LoadingOverlay
                visible={createPlayerIsPending}
                overlayProps={{ radius: "sm", blur: 2 }}
                loaderProps={{
                    children: `Creating your Player...`,
                    pt: 100,
                }}
            />
            <CreatePlayerFormProvider form={form}>
                <form onSubmit={form.onSubmit(handleSubmit)}>
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
                                <PlayerFormInputs />
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
                                <CursedTechniqueFormInputs />
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
                            <ScrollAreaAutosize mah={300} offsetScrollbars>
                                <ApplicationsFormInputs />
                            </ScrollAreaAutosize>
                        </Stepper.Step>

                        <Stepper.Completed>
                            {Object.keys(form.errors).length > 0 ? (
                                <Center
                                    className={clsx(gstyles.wrapSingleLongText)}
                                >
                                    <ScrollAreaAutosize mah={300}>
                                        <Text c="red" fw={500} mb="md">
                                            Some fields have errors. Please
                                            review your inputs:
                                        </Text>
                                        <Stack gap="xs">
                                            {Object.entries(form.errors).map(
                                                ([field, error], index) => (
                                                    <Paper
                                                        key={`${field}+${index}`}
                                                        p="xs"
                                                        withBorder
                                                    >
                                                        <Text
                                                            size="sm"
                                                            fw={500}
                                                            c="red.9"
                                                        >
                                                            {field.replace(
                                                                "_",
                                                                " "
                                                            )}
                                                            :
                                                        </Text>
                                                        <Text
                                                            size="sm"
                                                            c="dimmed"
                                                        >
                                                            {String(error)}
                                                        </Text>
                                                    </Paper>
                                                )
                                            )}
                                        </Stack>
                                    </ScrollAreaAutosize>
                                </Center>
                            ) : (
                                <Stack
                                    className={clsx(gstyles.wrapSingleLongText)}
                                >
                                    <ScrollAreaAutosize mah="60vh">
                                        <Divider
                                            label="Confirm your player information"
                                            mb="md"
                                        />
                                        <PlayerInfoFormList />

                                        <Divider
                                            label="Confirm your cursed technique definition"
                                            my="md"
                                        />
                                        <CursedTechniqueFormList />

                                        <Divider
                                            label="Confirm all cursed technique applications"
                                            my="md"
                                        />
                                        <ApplicationFormList />

                                        {createPlayerError && (
                                            <DisplayAPIError
                                                error={createPlayerError}
                                            />
                                        )}
                                    </ScrollAreaAutosize>

                                    <Button
                                        type="submit"
                                        loading={createPlayerIsPending}
                                        disabled={
                                            createPlayerIsPending ||
                                            createPlayerIsSuccess
                                        }
                                        size="md"
                                    >
                                        Create Player
                                    </Button>
                                </Stack>
                            )}
                        </Stepper.Completed>
                    </Stepper>

                    <Group justify="center" mt="xl">
                        {active > 0 && (
                            <Button
                                variant="default"
                                onClick={() => handleStepChange(active - 1)}
                                disabled={createPlayerIsPending}
                            >
                                Back
                            </Button>
                        )}

                        {active < FIELD_KEYS.length && (
                            <Button
                                onClick={() => handleStepChange(active + 1)}
                                disabled={createPlayerIsPending}
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
