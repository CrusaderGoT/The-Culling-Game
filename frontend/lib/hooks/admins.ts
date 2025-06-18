import {
    createMatchMutation,
    currentAdminOptions,
    getLastestMatchQueryKey,
} from "@/api/client/@tanstack/react-query.gen";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { queryClient } from "@/lib/query-client/get-query-client";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCurrentAdmin = (token: string, tokenError?: boolean) => {
    const query = useQuery({
        ...currentAdminOptions({
            headers: authHeader(token),
        }),
        enabled: !!token && !tokenError, // run only if token is available
    });

    return query;
};

export const useCreateMatch = (token: string) => {
    const mutation = useMutation({
        ...createMatchMutation({
            headers: authHeader(token),
        }),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while creating match -> ${getAPIErrorMessage(error)}`,
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
