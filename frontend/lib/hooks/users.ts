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

export const useCurrentUser = (token: string, tokenError?: boolean) => {
    const query = useQuery({
        ...currentUserOptions({
            headers: authHeader(token),
        }),
        enabled: !!token && !tokenError, // run only if token is available
    });

    return query;
};
