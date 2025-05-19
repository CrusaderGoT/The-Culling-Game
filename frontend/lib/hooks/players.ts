import { createPlayerMutation } from "@/api/client/@tanstack/react-query.gen";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";

export const useCreatePlayer = (token: string) => {
    const mutation = useMutation({
        ...createPlayerMutation({
            headers: { Authorization: `Bearer ${token}` },
        }),
        onError: (error) => {
            console.error(JSON.stringify(error));
            notifications.show({
                message: "An error occurred while creating player",
                color: "red",
            });
        },
        onSuccess: (player) => {
            notifications.show({
                message: `player ${player.name} created successful`,
                color: "green",
            });
        },
    });

    return mutation;
};
