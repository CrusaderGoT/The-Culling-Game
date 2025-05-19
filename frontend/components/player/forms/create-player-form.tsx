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
import { useAuth } from "@/lib/auth/auth-provider";
import { useCreatePlayer } from "@/lib/hooks/players";
import { useCurrentUser } from "@/lib/hooks/users";

import {
    Button,
    Center,
    Divider,
    Group,
    List,
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

export function CreatePlayerForm() {
    const token = useAuth();

    const router = useRouter();

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
                age: 18,
                gender: "non-binary",
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

    const { data: user, error: userError } = useCurrentUser(token);

    const {
        isPending: createPlayerIsPending,
        mutateAsync: createPlayerMutate,
        error: createPlayerError,
    } = useCreatePlayer(token);

    async function handleSubmit(data: CreatePlayerSchemaType) {
        if (user) {
            const newPlayer = await createPlayerMutate({
                // @ts-ignore: applications are always 5
                body: { ...data },
                path: { user: user.id },
            });

            if (newPlayer) {
                router.push("/player");
            }
        } else {
            notifications.show({
                message: "Error Loading User...Refresh Page",
                color: "red",
            });
        }
    }

    return (
        <Paper radius="md" p="md" withBorder>
            {userError && <DisplayAPIError error={userError} />}

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
                                <Center>
                                    <ScrollAreaAutosize mah={300}>
                                        <Text>
                                            Some fields have errors. Please
                                            review your inputs:
                                        </Text>
                                        <List>
                                            <Stack>
                                                {Object.entries(
                                                    form.errors
                                                ).map(
                                                    ([field, error], index) => (
                                                        <List.Item
                                                            key={`${field}+${index}`}
                                                        >
                                                            <Text c={"red.9"}>
                                                                {field}
                                                            </Text>
                                                            <List withPadding>
                                                                <Text>
                                                                    {error}
                                                                </Text>
                                                            </List>
                                                        </List.Item>
                                                    )
                                                )}
                                            </Stack>
                                        </List>
                                    </ScrollAreaAutosize>
                                </Center>
                            ) : (
                                <Stack style={{ textWrap: "wrap" }}>
                                    <ScrollAreaAutosize mah={"10%"}>
                                        <Divider label="confirm your player information" />

                                        <PlayerInfoFormList />

                                        <Divider label="confirm your cursed technique definition" />

                                        <CursedTechniqueFormList />

                                        <Divider label="confirm all cursed technique applications" />

                                        <ApplicationFormList />

                                        {createPlayerError && (
                                            <DisplayAPIError
                                                error={createPlayerError}
                                            />
                                        )}
                                    </ScrollAreaAutosize>
                                    <Button
                                        type="submit"
                                        disabled={createPlayerIsPending}
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
