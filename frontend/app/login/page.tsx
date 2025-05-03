import { LoginForm } from "@/components/user/forms/login-user-form";

import { Box, Title } from "@mantine/core";

import { IconFish } from "@tabler/icons-react";

export default async function LoginPage() {
    return (
        <Box>
            <Title ta={"center"} order={2}>
                Welcome Back <IconFish size={26} />
            </Title>
            <LoginForm />
        </Box>
    );
}
