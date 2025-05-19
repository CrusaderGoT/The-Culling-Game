import {
    createPlayerMutation,
    myPlayerOptions,
} from "@/api/client/@tanstack/react-query.gen";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";

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

export const useCurrentPlayer = (token: string) => {
    const query = useQuery({
        ...myPlayerOptions({
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
        // for unnecessary refetch, when you want to use a error state for UI
        refetchOnWindowFocus: false,
    });

    return query;
};
