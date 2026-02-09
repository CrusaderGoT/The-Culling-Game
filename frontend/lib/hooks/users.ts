import {
    createTokenMutation,
    createUserMutation,
    currentUserOptions,
} from "@/api/client/@tanstack/react-query.gen";

import { useMutation, useQuery } from "@tanstack/react-query";

import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { queryClient } from "@/lib/query-client/get-query-client";
import { createSession } from "@/lib/session";
import { notifications } from "@mantine/notifications";

export const useCreateUser = () => {
    const mutation = useMutation({
        ...createUserMutation(),
        onError: (error) => {
            notifications.show({
                message: `An error occurred while creating your account. -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "red",
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });

    return mutation;
};

export const useLoginUser = () => {
    const mutation = useMutation({
        ...createTokenMutation(),
        onError: (error) => {
            notifications.show({
                message: `An error occurred during logging in -> ${getAPIErrorMessage(
                    error
                )}`,
                color: "red",
            });
        },
        onSuccess: async (token) => {
            await createSession(token);
            notifications.show({
                message: "login successful",
                color: "green",
            });
            queryClient.invalidateQueries();
        },
    });

    return mutation;
};

/**
 * Custom React hook to fetch the current user's data using a provided authentication token.
 *
 * @param token - The authentication token used for API requests.
 * @returns The result of the user query, including loading, error, and data states.
 */
export const useCurrentUser = (token: string | undefined) => {
    const query = useQuery({
        ...currentUserOptions({
            headers: authHeader(token),
        }),
        enabled: !!token, // run only if token is available
    });

    return query;
};
