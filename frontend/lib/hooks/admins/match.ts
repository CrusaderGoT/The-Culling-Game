import {
    assignMatchWinnerMutation,
    createMatchMutation,
    deleteMatchMutation,
    getLastestMatchQueryKey,
} from "@/api/client/@tanstack/react-query.gen";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { queryClient } from "@/lib/query-client/get-query-client";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";

export const useAssignMatchWinner = (token: string | undefined) => {
    const mutation = useMutation({
        ...assignMatchWinnerMutation({
            headers: authHeader(token),
        }),
        onError(error) {
            notifications.show({
                message: `An Error Occured -> ${getAPIErrorMessage(error)}`,
                color: "red",
            });
        },
        onSuccess(data) {
            if (data.winner) {
                notifications.show({
                    message: `Match won by ${data.winner.name}`,
                });
            } else if (data.draw) {
                notifications.show({
                    message: "Match was a Draw",
                });
            } else {
                notifications.show({
                    message: "Success",
                });
            }
        },
    });

    return mutation;
};

export const useCreateMatch = (token: string | undefined) => {
    const mutation = useMutation({
        ...createMatchMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while creating match -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "yellow",
            });
        },
        onSuccess: (match) => {
            notifications.show({
                message: `match part ${match.part}: colony ${match.colony.country} started successfully`,
                color: "deepred",
            });
            queryClient.invalidateQueries({
                queryKey: [getLastestMatchQueryKey()],
            });
        },
    });
    return mutation;
};

export const useDeleteMatch = (token: string | undefined) => {
    const mutation = useMutation({
        ...deleteMatchMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while deleting match -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "yellow",
            });
        },
        onSuccess: (match) => {
            notifications.show({
                message: `match part ${match.part}: colony ${match.colony.country} deleted successfully`,
                color: "blue",
            });
            queryClient.invalidateQueries({
                queryKey: [getLastestMatchQueryKey()],
            });
        },
    });
    return mutation;
};
