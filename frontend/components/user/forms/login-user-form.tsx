"use client";

import {
    LoginFormProvider,
    loginUserSchema,
    useLoginForm,
} from "@/components/user/forms/login-form-context";

import {
    Button,
    Divider,
    Flex,
    Paper,
    PasswordInput,
    Stack,
    TextInput,
} from "@mantine/core";

import { zodResolver } from "mantine-form-zod-resolver";

export function LoginForm() {
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
                        />

                        <PasswordInput
                            flex={1}
                            label="Password"
                            key={form.key("password")}
                            {...form.getInputProps("password")}
                        />
                    </Flex>

                    <Stack my={"md"}>
                        <Button type="submit">Login</Button>

                        <Divider label="or" />

                        <Button color="green">Signup</Button>
                    </Stack>
                </form>
            </Paper>
        </LoginFormProvider>
    );
}
