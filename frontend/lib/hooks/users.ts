import {
    createTokenMutation,
    createUserMutation,
    currentUserOptions,
} from "@/api/client/@tanstack/react-query.gen";

import { useMutation, useQuery } from "@tanstack/react-query";

import { authHeader } from "@/lib/constants/AUTHCONSTANTS";
import { queryClient } from "@/lib/query-client/get-query-client";
import { createSession } from "@/lib/session";
import { notifications } from "@mantine/notifications";

export const useCreateUser = () => {
    const mutation = useMutation({
        ...createUserMutation(),
        onError: (error) => {
            console.log(JSON.stringify(error.detail));
            notifications.show({
                message: "An error occurred while creating your account.",
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
            console.log(JSON.stringify(error));
            notifications.show({
                message: "An error occurred during logging in",
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
 * @param tokenError - Optional flag indicating if there is an error with the token; disables the query if true.
 * @returns The result of the user query, including loading, error, and data states.
 */
export const useCurrentUser = (token: string, tokenError?: boolean) => {
    const query = useQuery({
        ...currentUserOptions({
            headers: authHeader(token),
        }),
        enabled: !!token && !tokenError, // run only if token is available
    });

    return query;
};
