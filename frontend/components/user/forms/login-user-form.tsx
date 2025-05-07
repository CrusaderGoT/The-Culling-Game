"use client";

import {
    LoginFormProvider,
    loginUserSchema,
    useLoginForm,
} from "@/components/user/forms/login-user-form-context";

import {
    Button,
    Divider,
    Flex,
    Paper,
    PasswordInput,
    Stack,
    TextInput,
} from "@mantine/core";
import { IconLockPassword, IconUser } from "@tabler/icons-react";

import { zodResolver } from "mantine-form-zod-resolver";
import { useRouter } from "next/navigation";

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

    return (
        <LoginFormProvider form={form}>
            <Paper radius="md" p="md" withBorder>
                <form onSubmit={form.onSubmit((data) => console.log(data))}>
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
                        <Button type="submit">Login</Button>

                        <Divider label="or" />

                        <Button
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
