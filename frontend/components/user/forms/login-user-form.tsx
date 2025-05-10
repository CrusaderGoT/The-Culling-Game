"use client";

import { DisplayAPIError } from "@/components/ui/display-api-error";
import {
    LoginFormProvider,
    loginUserSchema,
    LoginUserType,
    useLoginForm,
} from "@/components/user/forms/login-user-form-context";

import { useLoginUser } from "@/lib/hooks/users";

import {
    Alert,
    Button,
    Divider,
    Flex,
    LoadingOverlay,
    Paper,
    PasswordInput,
    Stack,
    TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
    IconAlertCircle,
    IconLockPassword,
    IconUser,
} from "@tabler/icons-react";

import { zodResolver } from "mantine-form-zod-resolver";
import { redirect, useRouter } from "next/navigation";

export function LoginForm() {
    const router = useRouter();

    const form = useLoginForm({
        mode: "uncontrolled",
        validate: zodResolver(loginUserSchema),
        initialValues: {
            username: "",
            password: "",
        },
    });

    const {
        isPending: loginUserIsPending,
        mutateAsync: loginUserAsync,
        error: loginUserError,
        isSuccess: loginUserIsSuccess,
    } = useLoginUser();

    const handleSubmit = async (data: LoginUserType) => {
        const token = await loginUserAsync({
            body: { username: data.username, password: data.password },
        });

        if (token.access_token) {
            redirect("/match");
        }
    };

    return (
        <LoginFormProvider form={form}>
            <Paper radius="md" p="md" withBorder>
                {loginUserError && (
                    <Alert
                        title="An Error Occured"
                        color="red"
                        icon={<IconAlertCircle />}
                    >
                        <DisplayAPIError error={loginUserError} />
                    </Alert>
                )}

                <LoadingOverlay
                    visible={loginUserIsSuccess}
                    zIndex={600}
                    overlayProps={{ radius: "sm", blur: 0 }}
                    loaderProps={{ type: "bars" }}
                />
                <LoadingOverlay
                    visible={loginUserIsSuccess}
                    overlayProps={{ radius: "sm", blur: 2 }}
                    loaderProps={{
                        children: "Redirecting to match...",
                        pt: 100,
                    }}
                />

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Flex direction={{ base: "column", md: "row" }} gap={"md"}>
                        <TextInput
                            flex={1}
                            label="Username"
                            key={form.key("username")}
                            {...form.getInputProps("username")}
                            leftSection={<IconUser size={18} />}
                        />

                        <PasswordInput
                            flex={1}
                            label="Password"
                            key={form.key("password")}
                            {...form.getInputProps("password")}
                            leftSection={<IconLockPassword size={18} />}
                        />
                    </Flex>

                    <Stack my={"md"}>
                        <Button type="submit" disabled={loginUserIsPending}>
                            Login
                        </Button>

                        <Divider label="or" />

                        <Button
                            disabled={loginUserIsPending}
                            color="green"
                            onClick={() => router.push("/signup")}
                        >
                            Signup
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </LoginFormProvider>
    );
}
