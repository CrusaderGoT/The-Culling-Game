"use client";

import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";

import { Country } from "@/api/client";
import { zCreateUser } from "@/api/client/zod.gen";

import { COUNTRIES } from "@/constants/COUNTRIES";
import {
    Box,
    Card,
    ComboboxItem,
    Flex,
    Group,
    OptionsFilter,
    Overlay,
    PasswordInput,
    ScrollArea,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { z } from "zod";

export function CreateUserForm() {
    type zCreateUserType = z.infer<typeof zCreateUser>;

    const initialValues: zCreateUserType = {
        username: "",
        email: "",
        country: Country.AD,
        password: "",
        confirm_password: "",
    };

    const form = useForm<zCreateUserType>({
        mode: "uncontrolled",
        initialValues,
        validate: zodResolver(zCreateUser),
    });

    const searchOptionsFilter: OptionsFilter = ({ options, search }) => {
        const splittedSearch = search.toLowerCase().trim().split(" ");
        return (options as ComboboxItem[]).filter((option) => {
            const words = option.label.toLowerCase().trim().split(" ");
            return splittedSearch.every((searchWord) =>
                words.some((word) => word.includes(searchWord))
            );
        });
    };

    return (
        <Box>
            <Title ta={"center"} order={1}>
                Create an Account
            </Title>
            <Group wrap="wrap-reverse" mt={10}>
                <Box flex={1}>
                    <form
                        onSubmit={form.onSubmit((values) =>
                            console.log(values)
                        )}
                    >
                        <Stack>
                            <TextInput
                                withAsterisk
                                label="Username"
                                placeholder="Not Your Player Name"
                                key={form.key("username")}
                                {...form.getInputProps("username")}
                            />
                            <TextInput
                                withAsterisk
                                label="Email"
                                placeholder="youremail@example.com"
                                key={form.key("email")}
                                {...form.getInputProps("email")}
                            />

                            <Select
                                label={"Country"}
                                placeholder="Select Your Country"
                                data={COUNTRIES}
                                filter={searchOptionsFilter}
                                searchable
                                nothingFoundMessage="No country with that name..."
                            />

                            <PasswordInput
                                withAsterisk
                                label="Password"
                                placeholder="your deepest darkest secret"
                                key={form.key("password")}
                                {...form.getInputProps("password")}
                            />
                            <PasswordInput
                                withAsterisk
                                label="Confirm"
                                placeholder="repeat your deepest darkest secret"
                                key={form.key("confirm_password")}
                                {...form.getInputProps("confirm_password")}
                            />
                        </Stack>
                    </form>
                </Box>

                <Card
                    flex={1}
                    component={Flex}
                    h={350}
                    mah={400}
                    style={{
                        backgroundImage:
                            "url(/images/Kogane_showing_player_data.png)",
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                    }}
                >
                    <Card.Section
                        flex={1}
                        style={{ zIndex: 5 }}
                        component={ScrollArea}
                    >
                        <Text ta={"center"} c={"white"} lh={"xl"} lts={2}>
                            Welcome to the Culling Games, a treacherous
                            battleground where only the cunning and the brave
                            survive. By creating a player, you take your first
                            step into a world of peril and opportunity. To
                            participate, forge your identity by filling out the
                            form. Choose your country, set your credentials, and
                            prepare yourself for the challenges ahead. But
                            beware—this is no ordinary game. The Culling Games
                            are fraught with danger, where every decision could
                            be your last. Will you rise to the challenge and
                            carve your name into legend, or will you fall to the
                            shadows of those who came before? The choice is
                            yours, but remember: survival is not guaranteed.
                        </Text>
                    </Card.Section>

                    <Card.Section>
                        <Group style={{ zIndex: 5 }}>
                            <Text c={"blue"}>Learn More</Text>
                        </Group>
                    </Card.Section>

                    <Overlay backgroundOpacity={0.7} zIndex={0} />
                </Card>
            </Group>
        </Box>
    );
}
