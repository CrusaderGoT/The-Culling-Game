import { CreateUserForm } from "@/components/forms/createUserForm";
import { Group, Paper } from "@mantine/core";

export default async function LoginPage() {
    return (
        <Paper withBorder p={"md"}>
            <CreateUserForm />
        </Paper>
    
);
}
